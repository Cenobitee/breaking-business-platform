package com.financialplatform.domain;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "investment_packages")
public class InvestmentPackage {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "business_id", nullable = false, updatable = false)
  private Business business;

  @Column(nullable = false, precision = 16, scale = 2)
  private BigDecimal amount;

  @Column(name = "profit_percentage", nullable = false, precision = 5, scale = 2)
  private BigDecimal profitPercentage;

  protected InvestmentPackage() {}

  public InvestmentPackage(Business business, BigDecimal amount, BigDecimal profitPercentage) {
    this.business = business;
    this.amount = amount;
    this.profitPercentage = profitPercentage;
  }

  public Long getId() { return id; }
  public Business getBusiness() { return business; }
  public BigDecimal getAmount() { return amount; }
  public BigDecimal getProfitPercentage() { return profitPercentage; }
  public void updateProfitPercentage(BigDecimal percentage) { this.profitPercentage = percentage; }
}
