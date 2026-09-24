package com.financialplatform.api.dto;

import java.math.BigDecimal;

public record InvestorAnalyticsResponse(
        BigDecimal initialCapital,
        BigDecimal totalRevenue,
        BigDecimal totalExpenses,
        BigDecimal netProfit,
        BigDecimal profitMarginPercentage,
        BigDecimal capitalHealthPercentage
) {}
