package com.financialplatform.api.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;

public record ExpenseRequest(
        @NotBlank @Size(max = 240) String description,
        @NotNull @DecimalMin("0.01") @Digits(integer = 12, fraction = 2) BigDecimal amount,
        @NotNull @PastOrPresent LocalDate incurredOn
        ,@NotBlank @Pattern(regexp = "RENT|SALARIES|UTILITIES|MARKETING|SUPPLIES|TRANSPORT|OTHER") String category
) {}
