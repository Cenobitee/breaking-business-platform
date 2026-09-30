package com.financialplatform.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.financialplatform.domain.AppUser;
import com.financialplatform.domain.Business;
import com.financialplatform.domain.InvestmentRemoval;
import com.financialplatform.domain.InvestmentPackage;
import com.financialplatform.domain.InvestmentRequest;
import com.financialplatform.domain.InvestmentRequestStatus;
import com.financialplatform.domain.InvestmentTransaction;
import com.financialplatform.domain.Role;
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
import java.time.Instant;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class InvestmentServiceTest {
  @Mock InvestmentRequestRepository requests;
  @Mock InvestmentTransactionRepository transactions;
  @Mock InvestmentRemovalRepository removals;
  @Mock UserRepository users;
  @Mock InvestmentHistoryPurgeRepository historyPurge;
  @Mock InvestmentPackageRepository packages;
  @Mock InvestmentCycleRepository cycles;
  @Mock SaleRepository sales;
  @Mock ExpenseRepository expenses;
  @Mock CatalogProductRepository products;

  private InvestmentService service() {
    return new InvestmentService(
        requests,
        transactions,
        removals,
        users,
        historyPurge,
        packages,
        cycles,
        sales,
        expenses,
        products);
  }

  @Test
  void investorCreatesAPendingRequest() {
    Business business = new Business("Irodori");
    AppUser investor =
        new AppUser("Investor", "investor@example.com", "hash", Role.INVESTOR, business);
    when(users.findByEmailIgnoreCase("investor@example.com")).thenReturn(Optional.of(investor));
    InvestmentPackage investmentPackage =
        new InvestmentPackage(business, new BigDecimal("25000.00"), new BigDecimal("20.00"));
    when(packages.findForUpdateById(3L)).thenReturn(Optional.of(investmentPackage));
    when(requests.save(any(InvestmentRequest.class)))
        .thenAnswer(invocation -> invocation.getArgument(0));

    var service = service();
    var response = service.requestInvestment(3L, 2, "investor@example.com");

    assertThat(response.amount()).isEqualByComparingTo("50000.00");
    assertThat(response.quantity()).isEqualTo(2);
    assertThat(investmentPackage.getRemainingUnits()).isEqualTo(98);
    assertThat(response.status()).isEqualTo(InvestmentRequestStatus.PENDING);
    assertThat(response.requestedAt()).isNotNull();
  }

  @Test
  void ownerApprovalCreatesDatedInvestmentTransaction() {
    Business business = new Business("Irodori");
    AppUser investor =
        new AppUser("Investor", "investor@example.com", "hash", Role.INVESTOR, business);
    AppUser owner = new AppUser("Owner", "owner@example.com", "hash", Role.OWNER, business);
    InvestmentRequest request =
        new InvestmentRequest(investor, new BigDecimal("50000.00"), new BigDecimal("25.00"));
    when(requests.findForUpdateById(7L)).thenReturn(Optional.of(request));
    when(users.findByEmailIgnoreCase("owner@example.com")).thenReturn(Optional.of(owner));
    when(transactions.save(any(InvestmentTransaction.class)))
        .thenAnswer(invocation -> invocation.getArgument(0));

    var service = service();
    var response = service.approve(7L, "owner@example.com");

    ArgumentCaptor<InvestmentTransaction> captor =
        ArgumentCaptor.forClass(InvestmentTransaction.class);
    verify(transactions).save(captor.capture());
    assertThat(request.getStatus()).isEqualTo(InvestmentRequestStatus.APPROVED);
    assertThat(request.getApprovedAt()).isNotNull();
    assertThat(request.getApprovedBy()).isSameAs(owner);
    assertThat(captor.getValue().getAmount()).isEqualByComparingTo("50000.00");
    assertThat(captor.getValue().getInvestedAt()).isEqualTo(request.getApprovedAt());
    assertThat(response.approvedBy()).isEqualTo("Owner");
  }

  @Test
  void aRequestCannotBeApprovedTwice() {
    Business business = new Business("Irodori");
    AppUser investor =
        new AppUser("Investor", "investor@example.com", "hash", Role.INVESTOR, business);
    AppUser owner = new AppUser("Owner", "owner@example.com", "hash", Role.OWNER, business);
    InvestmentRequest request =
        new InvestmentRequest(investor, new BigDecimal("1000.00"), new BigDecimal("20.00"));
    request.approve(owner, Instant.now());
    when(requests.findForUpdateById(9L)).thenReturn(Optional.of(request));
    when(users.findByEmailIgnoreCase("owner@example.com")).thenReturn(Optional.of(owner));

    var service = service();

    assertThatThrownBy(() -> service.approve(9L, "owner@example.com"))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("already been processed");
  }

  @Test
  void ownerCanDeleteAPendingRequestFromTheirBusiness() {
    Business business = new Business("Irodori");
    AppUser investor =
        new AppUser("Investor", "investor@example.com", "hash", Role.INVESTOR, business);
    AppUser owner = new AppUser("Owner", "owner@example.com", "hash", Role.OWNER, business);
    InvestmentRequest request =
        new InvestmentRequest(investor, new BigDecimal("20000.00"), new BigDecimal("22.00"));
    when(requests.findForUpdateById(12L)).thenReturn(Optional.of(request));
    when(users.findByEmailIgnoreCase("owner@example.com")).thenReturn(Optional.of(owner));

    var service = service();
    service.deletePendingRequest(12L, "owner@example.com");

    verify(requests).delete(request);
  }

  @Test
  void approvedRequestCannotBeDeleted() {
    Business business = new Business("Irodori");
    AppUser investor =
        new AppUser("Investor", "investor@example.com", "hash", Role.INVESTOR, business);
    AppUser owner = new AppUser("Owner", "owner@example.com", "hash", Role.OWNER, business);
    InvestmentRequest request =
        new InvestmentRequest(investor, new BigDecimal("20000.00"), new BigDecimal("22.00"));
    request.approve(owner, Instant.now());
    when(requests.findForUpdateById(13L)).thenReturn(Optional.of(request));
    when(users.findByEmailIgnoreCase("owner@example.com")).thenReturn(Optional.of(owner));

    var service = service();

    assertThatThrownBy(() -> service.deletePendingRequest(13L, "owner@example.com"))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("Only pending");
    verify(requests, never()).delete(request);
  }

  @Test
  void ownerRemovalCreatesAnAuditedRemovalRecord() {
    Business business = new Business("Irodori");
    AppUser investor =
        new AppUser("Investor", "investor@example.com", "hash", Role.INVESTOR, business);
    AppUser owner = new AppUser("Owner", "owner@example.com", "hash", Role.OWNER, business);
    InvestmentRequest request =
        new InvestmentRequest(investor, new BigDecimal("12000.00"), new BigDecimal("20.00"));
    request.approve(owner, Instant.now());
    InvestmentTransaction transaction =
        new InvestmentTransaction(request, owner, request.getApprovedAt());
    when(transactions.findForUpdateById(15L)).thenReturn(Optional.of(transaction));
    when(removals.existsByTransaction(transaction)).thenReturn(false);
    when(users.findByEmailIgnoreCase("owner@example.com")).thenReturn(Optional.of(owner));
    when(removals.save(any(InvestmentRemoval.class)))
        .thenAnswer(invocation -> invocation.getArgument(0));

    var service = service();
    var response = service.remove(15L, "owner@example.com");

    assertThat(response.status()).isEqualTo("REMOVED");
    assertThat(response.removedAt()).isNotNull();
    assertThat(response.removedBy()).isEqualTo("Owner");
    verify(removals).save(any(InvestmentRemoval.class));
  }

  @Test
  void ownerCanPermanentlyDeleteTheirBusinessInvestmentHistory() {
    Business business = org.mockito.Mockito.mock(Business.class);
    when(business.getId()).thenReturn(44L);
    AppUser owner = new AppUser("Owner", "owner@example.com", "hash", Role.OWNER, business);
    when(users.findByEmailIgnoreCase("owner@example.com")).thenReturn(Optional.of(owner));
    when(historyPurge.purgeForBusiness(44L)).thenReturn(6);

    var service = service();

    assertThat(service.deleteAllHistory("owner@example.com")).isEqualTo(6);
    verify(historyPurge).purgeForBusiness(44L);
  }
}
