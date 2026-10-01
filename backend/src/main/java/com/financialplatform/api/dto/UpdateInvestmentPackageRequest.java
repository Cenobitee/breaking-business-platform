package com.financialplatform.api.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.List;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateInvestmentPackageRequest(
    @NotNull @DecimalMin("1.00") BigDecimal amount,
    @NotNull @DecimalMin("0.00") @DecimalMax("100.00") BigDecimal earningMinPercentage,
    @NotNull @DecimalMin("0.00") @DecimalMax("100.00") BigDecimal earningMaxPercentage,
    @NotNull @Min(1) @Max(60) Integer durationMonths,
    @NotNull @Min(1) Integer totalUnits,
    @NotNull @Min(1) Integer maxUnitsPerInvestor,
    @NotBlank String projectName,
    @NotBlank String purpose,
    @Size(max = 1300000) String imageDataUrl,
    @Size(max = 6) List<@Size(max = 1300000) String> imageDataUrls,
    @NotNull @DecimalMin("1.00") BigDecimal fundingTarget,
    @NotNull List<Long> productIds,
    boolean active) {}
