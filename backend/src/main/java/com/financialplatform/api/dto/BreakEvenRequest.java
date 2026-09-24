package com.financialplatform.api.dto;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
public record BreakEvenRequest(@NotNull Long productId, @NotNull @DecimalMin("0.00") BigDecimal fixedCosts, @PositiveOrZero int expectedUnits) {}
