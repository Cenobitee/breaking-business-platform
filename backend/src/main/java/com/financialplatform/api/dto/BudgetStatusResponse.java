package com.financialplatform.api.dto;
import java.math.BigDecimal;
public record BudgetStatusResponse(Long id, String category, BigDecimal budget, BigDecimal actual, BigDecimal remaining, String status) {}
