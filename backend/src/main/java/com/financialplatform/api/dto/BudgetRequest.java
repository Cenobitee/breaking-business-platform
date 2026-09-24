package com.financialplatform.api.dto;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
public record BudgetRequest(@NotBlank @Pattern(regexp="RENT|SALARIES|UTILITIES|MARKETING|SUPPLIES|TRANSPORT|OTHER") String category, @NotBlank @Pattern(regexp="\\d{4}-\\d{2}") String month, @NotNull @DecimalMin("0.00") BigDecimal amount) {}
