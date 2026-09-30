package com.financialplatform.domain;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "investment_requests")
public class InvestmentRequest {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "investor_id", nullable = false, updatable = false)
  private AppUser investor;

  @Column(nullable = false, updatable = false, precision = 16, scale = 2)
  private BigDecimal amount;

  @Column(name = "profit_percentage", nullable = false, updatable = false, precision = 5, scale = 2)
  private BigDecimal profitPercentage;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "package_id", updatable = false)
  private InvestmentPackage investmentPackage;

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

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  private InvestmentRequestStatus status = InvestmentRequestStatus.PENDING;

  @Column(name = "requested_at", nullable = false, updatable = false)
  private Instant requestedAt = Instant.now();

  @Column(name = "approved_at")
  private Instant approvedAt;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "approved_by")
  private AppUser approvedBy;

  protected InvestmentRequest() {}

  public InvestmentRequest(AppUser investor, BigDecimal amount, BigDecimal profitPercentage) {
    this.investor = investor;
    this.amount = amount;
    this.profitPercentage = profitPercentage;
    this.unitPrice = amount;
    this.quantity = 1;
    this.earningMaxPercentage = profitPercentage;
    this.durationMonths = 1;
  }

  public InvestmentRequest(AppUser investor, InvestmentPackage investmentPackage, int quantity) {
    this.investor = investor;
    this.investmentPackage = investmentPackage;
    this.unitPrice = investmentPackage.getAmount();
    this.quantity = quantity;
    this.amount = unitPrice.multiply(BigDecimal.valueOf(quantity));
    this.profitPercentage = investmentPackage.getProfitPercentage();
    this.earningMaxPercentage = investmentPackage.getEarningMaxPercentage();
    this.durationMonths = investmentPackage.getDurationMonths();
  }

  public Long getId() {
    return id;
  }

  public AppUser getInvestor() {
    return investor;
  }

  public BigDecimal getAmount() {
    return amount;
  }

  public BigDecimal getProfitPercentage() {
    return profitPercentage;
  }

  public InvestmentPackage getInvestmentPackage() {
    return investmentPackage;
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

  public InvestmentRequestStatus getStatus() {
    return status;
  }

  public Instant getRequestedAt() {
    return requestedAt;
  }

  public Instant getApprovedAt() {
    return approvedAt;
  }

  public AppUser getApprovedBy() {
    return approvedBy;
  }

  public void approve(AppUser owner, Instant instant) {
    if (status != InvestmentRequestStatus.PENDING) {
      throw new IllegalArgumentException("This investment request has already been processed");
    }
    status = InvestmentRequestStatus.APPROVED;
    approvedBy = owner;
    approvedAt = instant;
  }
}
