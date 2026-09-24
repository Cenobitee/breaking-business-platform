package com.financialplatform.api.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record CreateInvestmentRequest(
        @NotNull @DecimalMin("1.00") @Digits(integer = 14, fraction = 2) BigDecimal amount
) {}
