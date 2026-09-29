package com.financialplatform.api.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record UpdateInvestmentPackageRequest(
    @NotNull @DecimalMin("0.00") @DecimalMax("100.00") BigDecimal profitPercentage) {}
