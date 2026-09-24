package com.financialplatform.repository;

import com.financialplatform.domain.Expense;
import com.financialplatform.domain.Business;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface ExpenseRepository extends JpaRepository<Expense, Long> {
    @Query("select coalesce(sum(e.amount), 0) from Expense e where e.createdBy.business = :business and e.incurredOn = :day and not exists (select c.id from ExpenseCancellation c where c.expense = e)")
    BigDecimal sumForDay(@Param("business") Business business, @Param("day") LocalDate day);

    @Query("select coalesce(sum(e.amount), 0) from Expense e where e.createdBy.business = :business and not exists (select c.id from ExpenseCancellation c where c.expense = e)")
    BigDecimal sumAllExpenses(@Param("business") Business business);

    @Query("select e from Expense e where e.createdBy.business = :business and not exists (select c.id from ExpenseCancellation c where c.expense = e) order by e.incurredOn desc, e.createdAt desc")
    List<Expense> findActiveByBusiness(@Param("business") Business business);
}
