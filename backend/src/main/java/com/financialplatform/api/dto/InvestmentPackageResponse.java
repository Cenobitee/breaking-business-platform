package com.financialplatform.api.dto;

import com.financialplatform.domain.InvestmentPackage;
import java.math.BigDecimal;

public record InvestmentPackageResponse(Long id, BigDecimal amount, BigDecimal profitPercentage) {
  public static InvestmentPackageResponse from(InvestmentPackage investmentPackage) {
    return new InvestmentPackageResponse(investmentPackage.getId(), investmentPackage.getAmount(), investmentPackage.getProfitPercentage());
  }
}
