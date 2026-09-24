package com.financialplatform.repository;
import com.financialplatform.domain.*;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.*;
public interface ExpenseBudgetRepository extends JpaRepository<ExpenseBudget,Long> {
    List<ExpenseBudget> findByBusinessAndBudgetMonthOrderByCategory(Business business, LocalDate month);
    Optional<ExpenseBudget> findByBusinessAndCategoryAndBudgetMonth(Business business, String category, LocalDate month);
}
