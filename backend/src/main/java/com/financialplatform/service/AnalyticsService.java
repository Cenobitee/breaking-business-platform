package com.financialplatform.service;

import com.financialplatform.api.dto.InvestorAnalyticsResponse;
import com.financialplatform.api.dto.OperationsAnalyticsResponse;
import com.financialplatform.domain.AppUser;
import com.financialplatform.repository.ExpenseRepository;
import com.financialplatform.repository.InvestmentTransactionRepository;
import com.financialplatform.repository.InvestorPositionRepository;
import com.financialplatform.repository.SaleRepository;
import com.financialplatform.repository.UserRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.ZoneId;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AnalyticsService {
  private static final BigDecimal ONE_HUNDRED = new BigDecimal("100");

  private final SaleRepository sales;
  private final ExpenseRepository expenses;
  private final InvestorPositionRepository investors;
  private final InvestmentTransactionRepository investmentTransactions;
  private final UserRepository users;
  private final ZoneId businessZone;

  public AnalyticsService(
      SaleRepository sales,
      ExpenseRepository expenses,
      InvestorPositionRepository investors,
      InvestmentTransactionRepository investmentTransactions,
      UserRepository users,
      @Value("${app.business-zone:Asia/Dhaka}") String businessZone) {
    this.sales = sales;
    this.expenses = expenses;
    this.investors = investors;
    this.investmentTransactions = investmentTransactions;
    this.users = users;
    this.businessZone = ZoneId.of(businessZone);
  }

  @Transactional(readOnly = true)
  public OperationsAnalyticsResponse operationsToday(String userEmail) {
    AppUser user = users.findByEmailIgnoreCase(userEmail).orElseThrow();
    LocalDate today = LocalDate.now(businessZone);
    var start = today.atStartOfDay(businessZone).toInstant();
    var end = today.plusDays(1).atStartOfDay(businessZone).toInstant();
    BigDecimal revenue = money(sales.sumTotalBetween(user.getBusiness(), start, end));
    long orderCount = sales.countActiveBetween(user.getBusiness(), start, end);
    BigDecimal aov =
        orderCount == 0
            ? BigDecimal.ZERO.setScale(2)
            : revenue.divide(BigDecimal.valueOf(orderCount), 2, RoundingMode.HALF_UP);
    BigDecimal dailyExpenses = money(expenses.sumForDay(user.getBusiness(), today));
    BigDecimal productCost = money(sales.sumDirectCostBetween(user.getBusiness(), start, end));
    BigDecimal actualProfit = money(revenue.subtract(productCost).subtract(dailyExpenses));
    return new OperationsAnalyticsResponse(
        today,
        revenue,
        orderCount,
        aov,
        dailyExpenses,
        money(revenue.subtract(dailyExpenses)),
        productCost,
        actualProfit);
  }

  @Transactional(readOnly = true)
  public InvestorAnalyticsResponse investorSummary(String userEmail) {
    AppUser user = users.findByEmailIgnoreCase(userEmail).orElseThrow();
    LocalDate today = LocalDate.now(businessZone);
    LocalDate monthStart = today.withDayOfMonth(1);
    LocalDate nextMonthStart = monthStart.plusMonths(1);
    var todayStart = today.atStartOfDay(businessZone).toInstant();
    var tomorrowStart = today.plusDays(1).atStartOfDay(businessZone).toInstant();
    var monthStartInstant = monthStart.atStartOfDay(businessZone).toInstant();
    BigDecimal initialCapital =
        money(
            investors
                .sumInitialCapital(user.getBusiness())
                .add(investmentTransactions.sumAllInvestments(user.getBusiness())));
    BigDecimal revenue = money(sales.sumAllRevenue(user.getBusiness()));
    BigDecimal totalExpenses = money(expenses.sumAllExpenses(user.getBusiness()));
    BigDecimal netProfit = money(revenue.subtract(totalExpenses));
    BigDecimal margin = percentage(netProfit, revenue);
    BigDecimal capitalHealth =
        initialCapital.signum() == 0
            ? BigDecimal.ZERO.setScale(2)
            : initialCapital
                .add(netProfit)
                .divide(initialCapital, 4, RoundingMode.HALF_UP)
                .multiply(ONE_HUNDRED)
                .setScale(2, RoundingMode.HALF_UP);
    BigDecimal todayRevenue = money(sales.sumTotalBetween(user.getBusiness(), todayStart, tomorrowStart));
    BigDecimal todayExpenses = money(expenses.sumForDay(user.getBusiness(), today));
    BigDecimal todayNetProfit = money(todayRevenue.subtract(todayExpenses));
    BigDecimal completedMonthRevenue =
        money(sales.sumTotalBetween(user.getBusiness(), monthStartInstant, todayStart));
    BigDecimal completedMonthExpenses =
        money(expenses.sumBetween(user.getBusiness(), monthStart, today));
    BigDecimal completedMonthNetProfit =
        money(completedMonthRevenue.subtract(completedMonthExpenses));
    return new InvestorAnalyticsResponse(
        initialCapital,
        revenue,
        totalExpenses,
        netProfit,
        margin,
        capitalHealth,
        todayRevenue,
        todayExpenses,
        todayNetProfit,
        completedMonthRevenue,
        completedMonthExpenses,
        completedMonthNetProfit,
        nextMonthStart);
  }

  private BigDecimal percentage(BigDecimal numerator, BigDecimal denominator) {
    if (denominator.signum() == 0) return BigDecimal.ZERO.setScale(2);
    return numerator
        .divide(denominator, 4, RoundingMode.HALF_UP)
        .multiply(ONE_HUNDRED)
        .setScale(2, RoundingMode.HALF_UP);
  }

  private BigDecimal money(BigDecimal value) {
    return value.setScale(2, RoundingMode.HALF_UP);
  }
}
