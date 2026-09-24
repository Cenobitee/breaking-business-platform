package com.financialplatform.service;

import com.financialplatform.api.dto.*;
import com.financialplatform.domain.*;
import com.financialplatform.repository.InvestmentRequestRepository;
import com.financialplatform.repository.InvestmentHistoryPurgeRepository;
import com.financialplatform.repository.InvestmentRemovalRepository;
import com.financialplatform.repository.InvestmentTransactionRepository;
import com.financialplatform.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class InvestmentService {
    private final InvestmentRequestRepository requests;
    private final InvestmentTransactionRepository transactions;
    private final InvestmentRemovalRepository removals;
    private final UserRepository users;
    private final InvestmentHistoryPurgeRepository historyPurge;

    public InvestmentService(
            InvestmentRequestRepository requests,
            InvestmentTransactionRepository transactions,
            InvestmentRemovalRepository removals,
            UserRepository users,
            InvestmentHistoryPurgeRepository historyPurge
    ) {
        this.requests = requests;
        this.transactions = transactions;
        this.removals = removals;
        this.users = users;
        this.historyPurge = historyPurge;
    }

    @Transactional
    public InvestmentRequestResponse requestInvestment(BigDecimal requestedAmount, String investorEmail) {
        AppUser investor = requireUser(investorEmail);
        BigDecimal amount = requestedAmount.setScale(2, RoundingMode.UNNECESSARY);
        return InvestmentRequestResponse.from(requests.save(new InvestmentRequest(investor, amount)));
    }

    @Transactional(readOnly = true)
    public InvestorInvestmentsResponse investorSummary(String investorEmail) {
        AppUser investor = requireUser(investorEmail);
        List<InvestmentRequestResponse> requestHistory = requests
                .findByInvestorOrderByRequestedAtDesc(investor)
                .stream().map(InvestmentRequestResponse::from).toList();
        List<InvestmentTransaction> investorTransactions = transactions
                .findByInvestorOrderByInvestedAtDesc(investor);
        Map<Long, InvestmentRemoval> removalsByTransaction = removalsFor(investorTransactions);
        List<InvestmentHistoryResponse> investmentHistory = investorTransactions.stream()
                .map(transaction -> InvestmentHistoryResponse.from(
                        transaction, removalsByTransaction.get(transaction.getId())
                )).toList();
        return new InvestorInvestmentsResponse(
                transactions.sumByInvestor(investor).setScale(2, RoundingMode.HALF_UP),
                requestHistory,
                investmentHistory
        );
    }

    @Transactional(readOnly = true)
    public List<InvestmentRequestResponse> pendingRequests(String ownerEmail) {
        AppUser owner = requireUser(ownerEmail);
        return requests.findByStatusAndInvestorBusinessOrderByRequestedAtAsc(
                        InvestmentRequestStatus.PENDING, owner.getBusiness())
                .stream().map(InvestmentRequestResponse::from).toList();
    }

    @Transactional
    public InvestmentHistoryResponse approve(long requestId, String ownerEmail) {
        InvestmentRequest request = requests.findForUpdateById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Investment request not found"));
        AppUser owner = requireUser(ownerEmail);
        requireSameBusiness(request.getInvestor(), owner);
        Instant investedAt = Instant.now();
        request.approve(owner, investedAt);
        return InvestmentHistoryResponse.from(
                transactions.save(new InvestmentTransaction(request, owner, investedAt))
        );
    }

    @Transactional
    public void deletePendingRequest(long requestId, String ownerEmail) {
        InvestmentRequest request = requests.findForUpdateById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Investment request not found"));
        AppUser owner = requireUser(ownerEmail);
        requireSameBusiness(request.getInvestor(), owner);
        if (request.getStatus() != InvestmentRequestStatus.PENDING) {
            throw new IllegalArgumentException("Only pending investment requests can be deleted");
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
        InvestmentTransaction transaction = transactions.findForUpdateById(transactionId)
                .orElseThrow(() -> new IllegalArgumentException("Investment not found"));
        AppUser owner = requireUser(ownerEmail);
        requireSameBusiness(transaction.getInvestor(), owner);
        if (removals.existsByTransaction(transaction)) {
            throw new IllegalArgumentException("This investment has already been removed");
        }
        InvestmentRemoval removal = removals.save(
                new InvestmentRemoval(transaction, owner, Instant.now())
        );
        return InvestmentHistoryResponse.from(transaction, removal);
    }

    @Transactional
    public int deleteAllHistory(String ownerEmail) {
        AppUser owner = requireUser(ownerEmail);
        return historyPurge.purgeForBusiness(owner.getBusiness().getId());
    }

    private Map<Long, InvestmentRemoval> removalsFor(List<InvestmentTransaction> investorTransactions) {
        if (investorTransactions.isEmpty()) return Map.of();
        return removals.findByTransactionIn(investorTransactions).stream()
                .collect(Collectors.toMap(
                        removal -> removal.getTransaction().getId(),
                        Function.identity()
                ));
    }

    private AppUser requireUser(String email) {
        return users.findByEmailIgnoreCase(email).orElseThrow();
    }

    private void requireSameBusiness(AppUser member, AppUser owner) {
        if (member.getBusiness() == null || owner.getBusiness() == null
                || (member.getBusiness().getId() != null && owner.getBusiness().getId() != null
                ? !member.getBusiness().getId().equals(owner.getBusiness().getId())
                : member.getBusiness() != owner.getBusiness())) {
            throw new IllegalArgumentException("Investment not found");
        }
    }
}
