package com.financialplatform.api.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record InvestmentCycleResponse(
    Long id,
    Long transactionId,
    String investorName,
    String projectName,
    String purpose,
    BigDecimal fundingTarget,
    BigDecimal fundedAmount,
    java.util.List<String> linkedProducts,
    BigDecimal principal,
    BigDecimal unitPrice,
    int quantity,
    BigDecimal estimatedMinPercentage,
    BigDecimal estimatedMaxPercentage,
    BigDecimal estimatedMinReturn,
    BigDecimal estimatedMaxReturn,
    BigDecimal monthlyPrincipal,
    BigDecimal monthlyProfitMin,
    BigDecimal monthlyProfitMax,
    BigDecimal monthlyPaymentMin,
    BigDecimal monthlyPaymentMax,
    BigDecimal capitalSharePercentage,
    Instant startsAt,
    Instant endsAt,
    String status,
    BigDecimal eligibleRevenue,
    BigDecimal eligibleExpenses,
    BigDecimal distributableProfit,
    BigDecimal investorProfit,
    BigDecimal settlementTotal,
    Instant completedAt,
    boolean withdrawalAvailable,
    Instant withdrawnAt) {}
