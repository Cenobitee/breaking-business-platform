package com.financialplatform.api.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record CreateInvestmentRequest(
    @NotNull Long packageId, @NotNull @Min(1) Integer quantity) {}
