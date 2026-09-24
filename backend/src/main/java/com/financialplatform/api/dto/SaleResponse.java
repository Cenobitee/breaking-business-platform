package com.financialplatform.api.dto;

import com.financialplatform.domain.Sale;

import java.math.BigDecimal;
import java.time.Instant;

public record SaleResponse(
        Long id,
        String itemName,
        int quantity,
        BigDecimal unitPrice,
        BigDecimal total,
        Instant createdAt,
        String createdBy
) {
    public static SaleResponse from(Sale sale) {
        return new SaleResponse(
                sale.getId(),
                sale.getItemName(),
                sale.getQuantity(),
                sale.getUnitPrice(),
                sale.getTotal(),
                sale.getCreatedAt(),
                sale.getCreatedBy().getFullName()
        );
    }
}
