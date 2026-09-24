package com.financialplatform.api.dto;

import com.financialplatform.domain.CatalogProduct;
import java.math.BigDecimal;
import java.time.Instant;

public record ProductResponse(Long id, String name, BigDecimal unitPrice, BigDecimal unitCost, int stockQuantity, int lowStockThreshold, Instant createdAt) {
    public static ProductResponse from(CatalogProduct product) { return new ProductResponse(product.getId(), product.getName(), product.getUnitPrice(), product.getUnitCost(), product.getStockQuantity(), product.getLowStockThreshold(), product.getCreatedAt()); }
}
