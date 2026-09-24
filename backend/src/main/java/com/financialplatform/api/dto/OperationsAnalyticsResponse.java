package com.financialplatform.api.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record OperationsAnalyticsResponse(
        LocalDate date,
        BigDecimal revenue,
        long orderCount,
        BigDecimal averageOrderValue,
        BigDecimal expenses,
        BigDecimal netOperatingAmount
) {}
