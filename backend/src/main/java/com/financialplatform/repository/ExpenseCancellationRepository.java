package com.financialplatform.repository;

import com.financialplatform.domain.Expense;
import com.financialplatform.domain.ExpenseCancellation;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ExpenseCancellationRepository extends JpaRepository<ExpenseCancellation, Long> {
    boolean existsByExpense(Expense expense);
}
