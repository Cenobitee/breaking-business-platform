package com.financialplatform.domain;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.ZoneOffset;

@Entity
@Table(name = "investment_cycles")
public class InvestmentCycle {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @OneToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "transaction_id", nullable = false, unique = true, updatable = false)
  private InvestmentTransaction transaction;

  @Column(name = "starts_at", nullable = false, updatable = false)
  private Instant startsAt;

  @Column(name = "ends_at", nullable = false, updatable = false)
  private Instant endsAt;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  private InvestmentCycleStatus status = InvestmentCycleStatus.ACTIVE;

  @Column(name = "completed_at")
  private Instant completedAt;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "completed_by")
  private AppUser completedBy;

  @Column(name = "final_revenue", precision = 16, scale = 2)
  private BigDecimal finalRevenue;

  @Column(name = "final_expenses", precision = 16, scale = 2)
  private BigDecimal finalExpenses;

  @Column(name = "distributable_profit", precision = 16, scale = 2)
  private BigDecimal distributableProfit;

  @Column(name = "investor_profit", precision = 16, scale = 2)
  private BigDecimal investorProfit;

  @Column(name = "withdrawn_at")
  private Instant withdrawnAt;

  protected InvestmentCycle() {}

  public InvestmentCycle(InvestmentTransaction transaction, Instant startsAt) {
    this.transaction = transaction;
    this.startsAt = startsAt;
    this.endsAt =
        startsAt
            .atZone(ZoneOffset.UTC)
            .plusMonths(transaction.getDurationMonths())
            .toInstant();
  }

  public Long getId() {
    return id;
  }

  public InvestmentTransaction getTransaction() {
    return transaction;
  }

  public Instant getStartsAt() {
    return startsAt;
  }

  public Instant getEndsAt() {
    return endsAt;
  }

  public InvestmentCycleStatus getStatus() {
    return status;
  }

  public Instant getCompletedAt() {
    return completedAt;
  }

  public AppUser getCompletedBy() {
    return completedBy;
  }

  public BigDecimal getFinalRevenue() {
    return finalRevenue;
  }

  public BigDecimal getFinalExpenses() {
    return finalExpenses;
  }

  public BigDecimal getDistributableProfit() {
    return distributableProfit;
  }

  public BigDecimal getInvestorProfit() {
    return investorProfit;
  }

  public Instant getWithdrawnAt() {
    return withdrawnAt;
  }

  public void complete(
      AppUser owner,
      Instant completedAt,
      BigDecimal revenue,
      BigDecimal expenses,
      BigDecimal distributableProfit,
      BigDecimal investorProfit) {
    if (status != InvestmentCycleStatus.ACTIVE) {
      throw new IllegalArgumentException("Cycle is already completed");
    }
    if (completedAt.isBefore(endsAt)) {
      throw new IllegalArgumentException("Cycle cannot be completed before its end date");
    }
    this.status = InvestmentCycleStatus.COMPLETED;
    this.completedBy = owner;
    this.completedAt = completedAt;
    this.finalRevenue = revenue;
    this.finalExpenses = expenses;
    this.distributableProfit = distributableProfit;
    this.investorProfit = investorProfit;
  }

  public void withdraw(Instant instant) {
    if (status != InvestmentCycleStatus.COMPLETED) {
      throw new IllegalArgumentException("The investment must reach maturity before withdrawal");
    }
    status = InvestmentCycleStatus.WITHDRAWN;
    withdrawnAt = instant;
  }
}
