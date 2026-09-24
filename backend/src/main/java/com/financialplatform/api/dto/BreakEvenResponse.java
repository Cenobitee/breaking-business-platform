package com.financialplatform.api.dto;
import java.math.BigDecimal;
public record BreakEvenResponse(String productName, BigDecimal sellingPrice, BigDecimal unitCost, BigDecimal profitPerUnit, int breakEvenUnits, int expectedUnits, BigDecimal expectedProfit, String explanation) {}
