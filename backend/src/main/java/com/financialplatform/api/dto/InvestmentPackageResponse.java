package com.financialplatform.api.dto;

import com.financialplatform.domain.InvestmentPackage;
import java.math.BigDecimal;
import java.util.List;

public record InvestmentPackageResponse(
    Long id,
    BigDecimal amount,
    BigDecimal earningMinPercentage,
    BigDecimal earningMaxPercentage,
    int durationMonths,
    int totalUnits,
    int remainingUnits,
    String projectName,
    String purpose,
    BigDecimal fundingTarget,
    BigDecimal fundedAmount,
    List<Long> productIds,
    List<String> productNames,
    boolean active) {
  public static InvestmentPackageResponse from(InvestmentPackage investmentPackage) {
    return new InvestmentPackageResponse(
        investmentPackage.getId(),
        investmentPackage.getAmount(),
        investmentPackage.getProfitPercentage(),
        investmentPackage.getEarningMaxPercentage(),
        investmentPackage.getDurationMonths(),
        investmentPackage.getTotalUnits(),
        investmentPackage.getRemainingUnits(),
        investmentPackage.getProjectName(),
        investmentPackage.getPurpose(),
        investmentPackage.getFundingTarget(),
        investmentPackage
            .getAmount()
            .multiply(BigDecimal.valueOf(investmentPackage.getCommittedUnits())),
        investmentPackage.getLinkedProducts().stream().map(product -> product.getId()).toList(),
        investmentPackage.getLinkedProducts().stream().map(product -> product.getName()).toList(),
        investmentPackage.isActive());
  }
}
