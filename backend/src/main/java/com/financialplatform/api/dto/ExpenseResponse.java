package com.financialplatform.api.dto;

import com.financialplatform.domain.Expense;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record ExpenseResponse(Long id, String description, BigDecimal amount, LocalDate incurredOn, String category, Instant createdAt, String createdBy) {
    public static ExpenseResponse from(Expense expense) {
        return new ExpenseResponse(expense.getId(), expense.getDescription(), expense.getAmount(), expense.getIncurredOn(), expense.getCategory(), expense.getCreatedAt(), expense.getCreatedBy().getFullName());
    }
}
