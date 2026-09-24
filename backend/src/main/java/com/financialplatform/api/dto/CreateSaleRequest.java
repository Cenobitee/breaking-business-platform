package com.financialplatform.api.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Digits;

import java.math.BigDecimal;

public record CreateSaleRequest(
        Long productId,
        @Size(max = 120) String itemName,
        @Positive @Max(10000) int quantity,
        @DecimalMin("0.01") @Digits(integer = 10, fraction = 2) BigDecimal unitPrice
) {
    public CreateSaleRequest(String itemName, int quantity, BigDecimal unitPrice) {
        this(null, itemName, quantity, unitPrice);
    }
}
