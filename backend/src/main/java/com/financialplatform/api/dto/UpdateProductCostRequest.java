package com.financialplatform.api.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record UpdateProductCostRequest(
    @NotNull @DecimalMin("0.00") @Digits(integer = 10, fraction = 2) BigDecimal baseCost) {}
