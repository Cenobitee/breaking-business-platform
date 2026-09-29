package com.financialplatform.api.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record InvestorAnalyticsResponse(
    BigDecimal initialCapital,
    BigDecimal totalRevenue,
    BigDecimal totalExpenses,
    BigDecimal netProfit,
    BigDecimal profitMarginPercentage,
    BigDecimal capitalHealthPercentage,
    BigDecimal todayRevenue,
    BigDecimal todayExpenses,
    BigDecimal todayNetProfit,
    BigDecimal completedMonthRevenue,
    BigDecimal completedMonthExpenses,
    BigDecimal completedMonthNetProfit,
    BigDecimal investorCombinedProfitPercentage,
    BigDecimal investorTodayProfit,
    BigDecimal investorCompletedMonthProfit,
    BigDecimal investorLifetimeRevenueShare,
    BigDecimal investorLifetimeExpenseShare,
    BigDecimal investorLifetimeNetProfit,
    LocalDate nextDisbursementDate) {}
