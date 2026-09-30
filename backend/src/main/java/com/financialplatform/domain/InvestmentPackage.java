package com.financialplatform.domain;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.util.LinkedHashSet;
import java.util.Set;

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

  @Column(name = "earning_max_percentage", nullable = false, precision = 5, scale = 2)
  private BigDecimal earningMaxPercentage;

  @Column(name = "duration_months", nullable = false)
  private int durationMonths;

  @Column(name = "total_units", nullable = false)
  private int totalUnits;

  @Column(name = "committed_units", nullable = false)
  private int committedUnits;

  @Column(name = "project_name", nullable = false, length = 140)
  private String projectName;

  @Column(nullable = false, length = 500)
  private String purpose;

  @Column(name = "funding_target", nullable = false, precision = 16, scale = 2)
  private BigDecimal fundingTarget;

  @Column(nullable = false)
  private boolean active = true;

  @ManyToMany
  @JoinTable(
      name = "investment_package_products",
      joinColumns = @JoinColumn(name = "package_id"),
      inverseJoinColumns = @JoinColumn(name = "product_id"))
  private Set<CatalogProduct> linkedProducts = new LinkedHashSet<>();

  protected InvestmentPackage() {}

  public InvestmentPackage(Business business, BigDecimal amount, BigDecimal profitPercentage) {
    this.business = business;
    this.amount = amount;
    this.profitPercentage = profitPercentage;
    this.earningMaxPercentage = profitPercentage.add(new BigDecimal("3.00"));
    this.durationMonths = 6;
    this.totalUnits = 100;
    this.projectName = "Business growth project";
    this.purpose = "Fund a specific business asset or expansion.";
    this.fundingTarget = amount.multiply(BigDecimal.valueOf(totalUnits));
  }

  public Long getId() { return id; }
  public Business getBusiness() { return business; }
  public BigDecimal getAmount() { return amount; }
  public BigDecimal getProfitPercentage() { return profitPercentage; }
  public BigDecimal getEarningMaxPercentage() { return earningMaxPercentage; }
  public int getDurationMonths() { return durationMonths; }
  public int getTotalUnits() { return totalUnits; }
  public int getCommittedUnits() { return committedUnits; }
  public int getRemainingUnits() { return totalUnits - committedUnits; }
  public String getProjectName() { return projectName; }
  public String getPurpose() { return purpose; }
  public BigDecimal getFundingTarget() { return fundingTarget; }
  public Set<CatalogProduct> getLinkedProducts() { return Set.copyOf(linkedProducts); }
  public boolean isActive() { return active; }
  public void setActive(boolean active) { this.active = active; }

  public void updateOffer(
      BigDecimal amount,
      BigDecimal minimum,
      BigDecimal maximum,
      int durationMonths,
      int totalUnits,
      String projectName,
      String purpose,
      BigDecimal fundingTarget,
      Set<CatalogProduct> linkedProducts) {
    if (maximum.compareTo(minimum) < 0) {
      throw new IllegalArgumentException("Maximum earnings cannot be lower than minimum earnings");
    }
    if (totalUnits < committedUnits) {
      throw new IllegalArgumentException("Total units cannot be lower than already committed units");
    }
    if (committedUnits > 0 && this.amount.compareTo(amount) != 0) {
      throw new IllegalArgumentException("Unit price cannot change after an investor reserves units");
    }
    this.amount = amount;
    this.profitPercentage = minimum;
    this.earningMaxPercentage = maximum;
    this.durationMonths = durationMonths;
    this.totalUnits = totalUnits;
    this.projectName = projectName.trim();
    this.purpose = purpose.trim();
    this.fundingTarget = fundingTarget;
    this.linkedProducts.clear();
    this.linkedProducts.addAll(linkedProducts);
  }

  public void commitUnits(int quantity) {
    if (quantity < 1 || quantity > getRemainingUnits()) {
      throw new IllegalArgumentException("Not enough investment units are available");
    }
    committedUnits += quantity;
  }

  public void releaseUnits(int quantity) {
    committedUnits = Math.max(0, committedUnits - quantity);
  }
}
