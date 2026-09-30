package com.financialplatform.api.dto;

import java.math.BigDecimal;

public record ProductProfitResponse(
    Long productId,
    String productName,
    BigDecimal sellingPrice,
    BigDecimal baseCost,
    BigDecimal profitPerUnit,
    long unitsSold,
    BigDecimal salesRevenue,
    BigDecimal totalProductCost,
    BigDecimal totalProductProfit) {}
