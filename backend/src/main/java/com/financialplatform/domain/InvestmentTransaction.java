package com.financialplatform.domain;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "investment_transactions")
public class InvestmentTransaction {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @OneToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "request_id", nullable = false, unique = true, updatable = false)
  private InvestmentRequest request;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "investor_id", nullable = false, updatable = false)
  private AppUser investor;

  @Column(nullable = false, updatable = false, precision = 16, scale = 2)
  private BigDecimal amount;

  @Column(name = "profit_percentage", nullable = false, updatable = false, precision = 5, scale = 2)
  private BigDecimal profitPercentage;

  @Column(name = "unit_price", nullable = false, updatable = false, precision = 16, scale = 2)
  private BigDecimal unitPrice;

  @Column(nullable = false, updatable = false)
  private int quantity;

  @Column(
      name = "earning_max_percentage",
      nullable = false,
      updatable = false,
      precision = 5,
      scale = 2)
  private BigDecimal earningMaxPercentage;

  @Column(name = "duration_months", nullable = false, updatable = false)
  private int durationMonths;

  @Column(name = "invested_at", nullable = false, updatable = false)
  private Instant investedAt;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "approved_by", nullable = false, updatable = false)
  private AppUser approvedBy;

  protected InvestmentTransaction() {}

  public InvestmentTransaction(InvestmentRequest request, AppUser owner, Instant investedAt) {
    this.request = request;
    this.investor = request.getInvestor();
    this.amount = request.getAmount();
    this.profitPercentage = request.getProfitPercentage();
    this.unitPrice = request.getUnitPrice();
    this.quantity = request.getQuantity();
    this.earningMaxPercentage = request.getEarningMaxPercentage();
    this.durationMonths = request.getDurationMonths();
    this.investedAt = investedAt;
    this.approvedBy = owner;
  }

  public Long getId() {
    return id;
  }

  public InvestmentRequest getRequest() {
    return request;
  }

  public AppUser getInvestor() {
    return investor;
  }

  public BigDecimal getAmount() {
    return amount;
  }

  public Instant getInvestedAt() {
    return investedAt;
  }

  public BigDecimal getProfitPercentage() {
    return profitPercentage;
  }

  public BigDecimal getUnitPrice() {
    return unitPrice;
  }

  public int getQuantity() {
    return quantity;
  }

  public BigDecimal getEarningMaxPercentage() {
    return earningMaxPercentage;
  }

  public int getDurationMonths() {
    return durationMonths;
  }

  public AppUser getApprovedBy() {
    return approvedBy;
  }
}
