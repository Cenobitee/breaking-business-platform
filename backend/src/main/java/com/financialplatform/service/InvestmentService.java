package com.financialplatform.service;

import com.financialplatform.api.dto.*;
import com.financialplatform.domain.*;
import com.financialplatform.repository.InvestmentHistoryPurgeRepository;
import com.financialplatform.repository.InvestmentCycleRepository;
import com.financialplatform.repository.InvestmentPackageRepository;
import com.financialplatform.repository.InvestmentRemovalRepository;
import com.financialplatform.repository.InvestmentRequestRepository;
import com.financialplatform.repository.InvestmentTransactionRepository;
import com.financialplatform.repository.UserRepository;
import com.financialplatform.repository.SaleRepository;
import com.financialplatform.repository.ExpenseRepository;
import com.financialplatform.repository.CatalogProductRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.LinkedHashSet;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InvestmentService {
  private static final BigDecimal ONE_HUNDRED = new BigDecimal("100");
  private final InvestmentRequestRepository requests;
  private final InvestmentTransactionRepository transactions;
  private final InvestmentRemovalRepository removals;
  private final UserRepository users;
  private final InvestmentHistoryPurgeRepository historyPurge;
  private final InvestmentPackageRepository packages;
  private final InvestmentCycleRepository cycles;
  private final SaleRepository sales;
  private final ExpenseRepository expenses;
  private final CatalogProductRepository products;

  public InvestmentService(
      InvestmentRequestRepository requests,
      InvestmentTransactionRepository transactions,
      InvestmentRemovalRepository removals,
      UserRepository users,
      InvestmentHistoryPurgeRepository historyPurge,
      InvestmentPackageRepository packages,
      InvestmentCycleRepository cycles,
      SaleRepository sales,
      ExpenseRepository expenses,
      CatalogProductRepository products) {
    this.requests = requests;
    this.transactions = transactions;
    this.removals = removals;
    this.users = users;
    this.historyPurge = historyPurge;
    this.packages = packages;
    this.cycles = cycles;
    this.sales = sales;
    this.expenses = expenses;
    this.products = products;
  }

  @Transactional
  public InvestmentRequestResponse requestInvestment(
      long packageId, int quantity, String investorEmail) {
    AppUser investor = requireUser(investorEmail);
    InvestmentPackage investmentPackage =
        packages
            .findForUpdateById(packageId)
            .filter(item -> item.isActive() && sameBusiness(item.getBusiness(), investor.getBusiness()))
            .orElseThrow(() -> new IllegalArgumentException("Investment offer not found"));
    investmentPackage.commitUnits(quantity);
    packages.save(investmentPackage);
    return InvestmentRequestResponse.from(
        requests.save(new InvestmentRequest(investor, investmentPackage, quantity)));
  }

  @Transactional
  public List<InvestmentPackageResponse> investmentPackages(String userEmail) {
    AppUser user = requireUser(userEmail);
    List<InvestmentPackage> visiblePackages = user.getRole() == Role.OWNER
        ? packages.findByBusinessOrderByIdDesc(user.getBusiness())
        : packages.findByBusinessAndActiveTrueOrderByIdDesc(user.getBusiness());
    return visiblePackages.stream()
        .filter(investmentPackage -> user.getRole() == Role.OWNER || investmentPackage.getRemainingUnits() > 0)
        .map(InvestmentPackageResponse::from)
        .toList();
  }

  @Transactional
  public InvestmentPackageResponse createPackage(
      CreateInvestmentPackageRequest request, String ownerEmail) {
    AppUser owner = requireUser(ownerEmail);
    if (owner.getRole() != Role.OWNER) throw new IllegalArgumentException("Owner access is required");
    BigDecimal amount = request.amount().setScale(2, RoundingMode.HALF_UP);
    InvestmentPackage investmentPackage =
        new InvestmentPackage(owner.getBusiness(), amount, request.earningMinPercentage());
    investmentPackage.updateOffer(
        amount,
        request.earningMinPercentage().setScale(2, RoundingMode.HALF_UP),
        request.earningMaxPercentage().setScale(2, RoundingMode.HALF_UP),
        request.durationMonths(), request.totalUnits(), request.projectName(), request.purpose(),
        request.fundingTarget().setScale(2, RoundingMode.HALF_UP),
        linkedProducts(request.productIds(), owner));
    investmentPackage.setActive(request.active());
    return InvestmentPackageResponse.from(packages.save(investmentPackage));
  }

  @Transactional
  public InvestmentPackageResponse updatePackage(
      long packageId, UpdateInvestmentPackageRequest update, String ownerEmail) {
    AppUser owner = requireUser(ownerEmail);
    InvestmentPackage investmentPackage =
        packages.findForUpdateById(packageId)
            .filter(item -> sameBusiness(item.getBusiness(), owner.getBusiness()))
            .orElseThrow(() -> new IllegalArgumentException("Investment package not found"));
    BigDecimal minimum = update.earningMinPercentage().setScale(2, RoundingMode.HALF_UP);
    BigDecimal maximum = update.earningMaxPercentage().setScale(2, RoundingMode.HALF_UP);
    var linkedProducts = linkedProducts(update.productIds(), owner);
    investmentPackage.updateOffer(
        update.amount().setScale(2, RoundingMode.HALF_UP),
        minimum,
        maximum,
        update.durationMonths(),
        update.totalUnits(),
        update.projectName(),
        update.purpose(),
        update.fundingTarget().setScale(2, RoundingMode.HALF_UP),
        linkedProducts);
    investmentPackage.setActive(update.active());
    return InvestmentPackageResponse.from(packages.save(investmentPackage));
  }

  @Transactional
  public void deletePackage(long packageId, String ownerEmail) {
    AppUser owner = requireUser(ownerEmail);
    if (owner.getRole() != Role.OWNER) throw new IllegalArgumentException("Owner access is required");
    InvestmentPackage investmentPackage = packages.findForUpdateById(packageId)
        .filter(item -> sameBusiness(item.getBusiness(), owner.getBusiness()))
        .orElseThrow(() -> new IllegalArgumentException("Investment post not found"));
    if (requests.existsByInvestmentPackage(investmentPackage)) {
      throw new IllegalArgumentException(
          "This post has investor records and cannot be deleted. Make it inactive instead.");
    }
    packages.delete(investmentPackage);
  }

  private LinkedHashSet<CatalogProduct> linkedProducts(List<Long> productIds, AppUser owner) {
    var linkedProducts = new LinkedHashSet<>(products.findAllById(productIds));
    if (linkedProducts.size() != new LinkedHashSet<>(productIds).size()
        || linkedProducts.stream()
            .anyMatch(product -> !sameBusiness(product.getBusiness(), owner.getBusiness()))) {
      throw new IllegalArgumentException("One or more linked products were not found");
    }
    return linkedProducts;
  }

  @Transactional(readOnly = true)
  public InvestorInvestmentsResponse investorSummary(String investorEmail) {
    AppUser investor = requireUser(investorEmail);
    List<InvestmentRequestResponse> requestHistory =
        requests.findByInvestorOrderByRequestedAtDesc(investor).stream()
            .map(InvestmentRequestResponse::from)
            .toList();
    List<InvestmentTransaction> investorTransactions =
        transactions.findByInvestorOrderByInvestedAtDesc(investor);
    Map<Long, InvestmentRemoval> removalsByTransaction = removalsFor(investorTransactions);
    List<InvestmentHistoryResponse> investmentHistory =
        investorTransactions.stream()
            .map(
                transaction ->
                    InvestmentHistoryResponse.from(
                        transaction, removalsByTransaction.get(transaction.getId())))
            .toList();
    return new InvestorInvestmentsResponse(
        transactions.sumByInvestor(investor).setScale(2, RoundingMode.HALF_UP),
        requestHistory,
        investmentHistory,
        cycles.findByInvestor(investor).stream().map(this::cycleResponse).toList());
  }

  @Transactional(readOnly = true)
  public List<InvestmentRequestResponse> pendingRequests(String ownerEmail) {
    AppUser owner = requireUser(ownerEmail);
    return requests
        .findByStatusAndInvestorBusinessOrderByRequestedAtAsc(
            InvestmentRequestStatus.PENDING, owner.getBusiness())
        .stream()
        .map(InvestmentRequestResponse::from)
        .toList();
  }

  @Transactional
  public InvestmentHistoryResponse approve(long requestId, String ownerEmail) {
    InvestmentRequest request =
        requests
            .findForUpdateById(requestId)
            .orElseThrow(() -> new IllegalArgumentException("Investment request not found"));
    AppUser owner = requireUser(ownerEmail);
    requireSameBusiness(request.getInvestor(), owner);
    Instant investedAt = Instant.now();
    request.approve(owner, investedAt);
    InvestmentTransaction transaction =
        transactions.save(new InvestmentTransaction(request, owner, investedAt));
    cycles.save(new InvestmentCycle(transaction, investedAt));
    return InvestmentHistoryResponse.from(transaction);
  }

  @Transactional(readOnly = true)
  public List<InvestmentCycleResponse> businessCycles(String ownerEmail) {
    AppUser owner = requireUser(ownerEmail);
    return cycles.findByBusiness(owner.getBusiness()).stream().map(this::cycleResponse).toList();
  }

  @Transactional
  public InvestmentCycleResponse completeCycle(long cycleId, String ownerEmail) {
    AppUser owner = requireUser(ownerEmail);
    InvestmentCycle cycle =
        cycles.findByIdAndStatus(cycleId, InvestmentCycleStatus.ACTIVE)
            .filter(item -> item.getTransaction().getInvestor().getBusiness().getId().equals(owner.getBusiness().getId()))
            .orElseThrow(() -> new IllegalArgumentException("Active investment cycle not found"));
    Instant completedAt = Instant.now();
    if (completedAt.isBefore(cycle.getEndsAt())) {
      throw new IllegalArgumentException("This investment cycle has not ended yet");
    }
    BigDecimal revenue = eligibleRevenue(cycle, cycle.getStartsAt(), cycle.getEndsAt());
    BigDecimal costs = eligibleCosts(cycle, cycle.getStartsAt(), cycle.getEndsAt());
    BigDecimal distributable = distributableProfit(revenue, costs);
    BigDecimal investorProfit = boundedInvestorProfit(cycle, distributable);
    cycle.complete(owner, completedAt, revenue, costs, distributable, investorProfit);
    return cycleResponse(cycles.save(cycle));
  }

  @Transactional
  public InvestmentCycleResponse withdrawMaturedInvestment(long cycleId, String investorEmail) {
    AppUser investor = requireUser(investorEmail);
    InvestmentCycle cycle = cycles.findById(cycleId)
        .filter(item -> item.getTransaction().getInvestor().getId().equals(investor.getId()))
        .orElseThrow(() -> new IllegalArgumentException("Investment cycle not found"));
    Instant now = Instant.now();
    if (now.isBefore(cycle.getEndsAt())) {
      throw new IllegalArgumentException("This investment is locked until the tenure ends");
    }
    if (cycle.getStatus() == InvestmentCycleStatus.WITHDRAWN) {
      throw new IllegalArgumentException("This investment return has already been withdrawn");
    }
    if (cycle.getStatus() == InvestmentCycleStatus.ACTIVE) {
      BigDecimal revenue = eligibleRevenue(cycle, cycle.getStartsAt(), cycle.getEndsAt());
      BigDecimal costs = eligibleCosts(cycle, cycle.getStartsAt(), cycle.getEndsAt());
      BigDecimal distributable = distributableProfit(revenue, costs);
      cycle.complete(null, now, revenue, costs, distributable, boundedInvestorProfit(cycle, distributable));
    }
    cycle.withdraw(now);
    return cycleResponse(cycles.save(cycle));
  }

  private InvestmentCycleResponse cycleResponse(InvestmentCycle cycle) {
    boolean finalized = cycle.getStatus() != InvestmentCycleStatus.ACTIVE;
    Instant calculationEnd = finalized
        ? cycle.getEndsAt()
        : (Instant.now().isBefore(cycle.getEndsAt()) ? Instant.now() : cycle.getEndsAt());
    BigDecimal revenue = finalized
        ? cycle.getFinalRevenue()
        : eligibleRevenue(cycle, cycle.getStartsAt(), calculationEnd);
    BigDecimal costs = finalized
        ? cycle.getFinalExpenses()
        : eligibleCosts(cycle, cycle.getStartsAt(), calculationEnd);
    BigDecimal distributable = finalized
        ? cycle.getDistributableProfit()
        : distributableProfit(revenue, costs);
    BigDecimal profit = finalized
        ? cycle.getInvestorProfit()
        : boundedInvestorProfit(cycle, distributable);
    InvestmentTransaction transaction = cycle.getTransaction();
    InvestmentPackage investmentPackage = transaction.getRequest().getInvestmentPackage();
    BigDecimal totalCapital = money(transactions.sumAllInvestments(transaction.getInvestor().getBusiness()));
    BigDecimal unitShare = investmentPackage == null
        ? percentage(transaction.getAmount(), totalCapital)
        : percentage(BigDecimal.valueOf(transaction.getQuantity()), BigDecimal.valueOf(investmentPackage.getTotalUnits()));
    BigDecimal estimatedMinimum = projectedReturn(transaction, transaction.getProfitPercentage());
    BigDecimal estimatedMaximum = projectedReturn(transaction, transaction.getEarningMaxPercentage());
    int months = transaction.getDurationMonths();
    BigDecimal monthlyPrincipal = transaction.getAmount().divide(BigDecimal.valueOf(months), 2, RoundingMode.HALF_UP);
    BigDecimal monthlyProfitMinimum =
        transaction.getAmount().multiply(transaction.getProfitPercentage())
            .divide(ONE_HUNDRED, 2, RoundingMode.HALF_UP)
            .divide(BigDecimal.valueOf(months), 2, RoundingMode.HALF_UP);
    BigDecimal monthlyProfitMaximum =
        transaction.getAmount().multiply(transaction.getEarningMaxPercentage())
            .divide(ONE_HUNDRED, 2, RoundingMode.HALF_UP)
            .divide(BigDecimal.valueOf(months), 2, RoundingMode.HALF_UP);
    return new InvestmentCycleResponse(
        cycle.getId(), transaction.getId(), transaction.getInvestor().getFullName(),
        investmentPackage == null ? "Investment project" : investmentPackage.getProjectName(),
        investmentPackage == null ? "Business investment" : investmentPackage.getPurpose(),
        investmentPackage == null ? transaction.getAmount() : investmentPackage.getFundingTarget(),
        investmentPackage == null
            ? transaction.getAmount()
            : investmentPackage.getAmount().multiply(BigDecimal.valueOf(investmentPackage.getCommittedUnits())),
        investmentPackage == null
            ? List.of()
            : investmentPackage.getLinkedProducts().stream().map(CatalogProduct::getName).toList(),
        transaction.getAmount(), transaction.getUnitPrice(), transaction.getQuantity(),
        transaction.getProfitPercentage(), transaction.getEarningMaxPercentage(),
        estimatedMinimum, estimatedMaximum, monthlyPrincipal, monthlyProfitMinimum,
        monthlyProfitMaximum, monthlyPrincipal.add(monthlyProfitMinimum),
        monthlyPrincipal.add(monthlyProfitMaximum), unitShare,
        cycle.getStartsAt(), cycle.getEndsAt(), cycle.getStatus().name(), revenue, costs,
        distributable, profit, transaction.getAmount().add(profit), cycle.getCompletedAt(),
        cycle.getStatus() == InvestmentCycleStatus.COMPLETED, cycle.getWithdrawnAt());
  }

  private BigDecimal distributableProfit(BigDecimal revenue, BigDecimal costs) {
    BigDecimal verifiedProfit = revenue.subtract(costs).max(BigDecimal.ZERO);
    return verifiedProfit.multiply(new BigDecimal("0.95")).setScale(2, RoundingMode.HALF_UP);
  }

  private BigDecimal eligibleRevenue(InvestmentCycle cycle, Instant start, Instant end) {
    InvestmentPackage investmentPackage = cycle.getTransaction().getRequest().getInvestmentPackage();
    Business business = cycle.getTransaction().getInvestor().getBusiness();
    if (investmentPackage == null || investmentPackage.getLinkedProducts().isEmpty()) {
      return money(sales.sumTotalBetween(business, start, end));
    }
    List<Long> productIds =
        investmentPackage.getLinkedProducts().stream().map(CatalogProduct::getId).toList();
    return money(sales.sumTotalBetweenForProducts(business, productIds, start, end));
  }

  private BigDecimal eligibleCosts(InvestmentCycle cycle, Instant start, Instant end) {
    InvestmentPackage investmentPackage = cycle.getTransaction().getRequest().getInvestmentPackage();
    Business business = cycle.getTransaction().getInvestor().getBusiness();
    if (investmentPackage == null || investmentPackage.getLinkedProducts().isEmpty()) {
      return money(expenses.sumCreatedBetween(business, start, end));
    }
    List<Long> productIds =
        investmentPackage.getLinkedProducts().stream().map(CatalogProduct::getId).toList();
    return money(sales.sumDirectCostBetweenForProducts(business, productIds, start, end));
  }

  private BigDecimal allocateByUnits(InvestmentCycle cycle, BigDecimal distributable) {
    InvestmentTransaction transaction = cycle.getTransaction();
    InvestmentPackage investmentPackage = transaction.getRequest().getInvestmentPackage();
    if (investmentPackage == null || investmentPackage.getTotalUnits() < 1) {
      return BigDecimal.ZERO.setScale(2);
    }
    return distributable
        .multiply(BigDecimal.valueOf(transaction.getQuantity()))
        .divide(BigDecimal.valueOf(investmentPackage.getTotalUnits()), 2, RoundingMode.HALF_UP);
  }

  private BigDecimal boundedInvestorProfit(InvestmentCycle cycle, BigDecimal distributable) {
    InvestmentTransaction transaction = cycle.getTransaction();
    BigDecimal verifiedShare = allocateByUnits(cycle, distributable);
    BigDecimal maximumOfferProfit =
        transaction
            .getAmount()
            .multiply(transaction.getEarningMaxPercentage())
            .divide(ONE_HUNDRED, 2, RoundingMode.HALF_UP);
    return verifiedShare.min(maximumOfferProfit).max(BigDecimal.ZERO).setScale(2);
  }

  private BigDecimal projectedReturn(InvestmentTransaction transaction, BigDecimal rate) {
    return transaction.getAmount()
        .multiply(BigDecimal.ONE.add(rate.divide(ONE_HUNDRED, 6, RoundingMode.HALF_UP)))
        .setScale(2, RoundingMode.HALF_UP);
  }

  private BigDecimal percentage(BigDecimal part, BigDecimal total) {
    if (total.signum() == 0) return BigDecimal.ZERO.setScale(2);
    return part.multiply(ONE_HUNDRED).divide(total, 2, RoundingMode.HALF_UP);
  }

  private BigDecimal money(BigDecimal value) {
    return value.setScale(2, RoundingMode.HALF_UP);
  }

  @Transactional
  public void deletePendingRequest(long requestId, String ownerEmail) {
    InvestmentRequest request =
        requests
            .findForUpdateById(requestId)
            .orElseThrow(() -> new IllegalArgumentException("Investment request not found"));
    AppUser owner = requireUser(ownerEmail);
    requireSameBusiness(request.getInvestor(), owner);
    if (request.getStatus() != InvestmentRequestStatus.PENDING) {
      throw new IllegalArgumentException("Only pending investment requests can be deleted");
    }
    if (request.getInvestmentPackage() != null) {
      InvestmentPackage investmentPackage =
          packages.findForUpdateById(request.getInvestmentPackage().getId()).orElseThrow();
      investmentPackage.releaseUnits(request.getQuantity());
      packages.save(investmentPackage);
    }
    requests.delete(request);
  }

  @Transactional(readOnly = true)
  public List<OwnerInvestmentResponse> activeInvestments(String ownerEmail) {
    AppUser owner = requireUser(ownerEmail);
    return transactions.findActiveInvestments(owner.getBusiness()).stream()
        .map(OwnerInvestmentResponse::from)
        .toList();
  }

  @Transactional
  public InvestmentHistoryResponse remove(long transactionId, String ownerEmail) {
    InvestmentTransaction transaction =
        transactions
            .findForUpdateById(transactionId)
            .orElseThrow(() -> new IllegalArgumentException("Investment not found"));
    AppUser owner = requireUser(ownerEmail);
    requireSameBusiness(transaction.getInvestor(), owner);
    if (removals.existsByTransaction(transaction)) {
      throw new IllegalArgumentException("This investment has already been removed");
    }
    if (cycles.existsByTransactionAndStatus(transaction, InvestmentCycleStatus.ACTIVE)) {
      throw new IllegalArgumentException(
          "Active cycle capital cannot be removed before its settlement is finalized");
    }
    InvestmentRemoval removal =
        removals.save(new InvestmentRemoval(transaction, owner, Instant.now()));
    return InvestmentHistoryResponse.from(transaction, removal);
  }

  @Transactional
  public int deleteAllHistory(String ownerEmail) {
    AppUser owner = requireUser(ownerEmail);
    return historyPurge.purgeForBusiness(owner.getBusiness().getId());
  }

  private Map<Long, InvestmentRemoval> removalsFor(
      List<InvestmentTransaction> investorTransactions) {
    if (investorTransactions.isEmpty()) return Map.of();
    return removals.findByTransactionIn(investorTransactions).stream()
        .collect(
            Collectors.toMap(removal -> removal.getTransaction().getId(), Function.identity()));
  }

  private AppUser requireUser(String email) {
    return users.findByEmailIgnoreCase(email).orElseThrow();
  }

  private void requireSameBusiness(AppUser member, AppUser owner) {
    if (member.getBusiness() == null
        || owner.getBusiness() == null
        || (member.getBusiness().getId() != null && owner.getBusiness().getId() != null
            ? !member.getBusiness().getId().equals(owner.getBusiness().getId())
            : member.getBusiness() != owner.getBusiness())) {
      throw new IllegalArgumentException("Investment not found");
    }
  }

  private boolean sameBusiness(Business first, Business second) {
    if (first == null || second == null) return false;
    if (first.getId() == null || second.getId() == null) return first == second;
    return first.getId().equals(second.getId());
  }
}
