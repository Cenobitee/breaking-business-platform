package com.financialplatform.service;

import com.financialplatform.api.dto.ExpenseRequest;
import com.financialplatform.api.dto.ExpenseResponse;
import com.financialplatform.domain.*;
import com.financialplatform.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.RoundingMode;
import java.util.List;

@Service
public class ExpenseService {
    private final ExpenseRepository expenses;
    private final ExpenseCancellationRepository cancellations;
    private final UserRepository users;

    public ExpenseService(ExpenseRepository expenses, ExpenseCancellationRepository cancellations, UserRepository users) {
        this.expenses = expenses; this.cancellations = cancellations; this.users = users;
    }

    @Transactional(readOnly = true)
    public List<ExpenseResponse> list(String email) {
        AppUser user = user(email);
        return expenses.findActiveByBusiness(user.getBusiness()).stream().map(ExpenseResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public ExpenseResponse get(long id, String email) { return ExpenseResponse.from(expense(id, user(email))); }

    @Transactional
    public ExpenseResponse create(ExpenseRequest request, String email) {
        AppUser user = user(email);
        Expense expense = new Expense(request.description(), request.amount().setScale(2, RoundingMode.UNNECESSARY), request.incurredOn(), request.category(), user);
        return ExpenseResponse.from(expenses.save(expense));
    }

    @Transactional
    public ExpenseResponse update(long id, ExpenseRequest request, String email) {
        AppUser user = user(email); Expense original = expense(id, user);
        if (cancellations.existsByExpense(original)) throw new IllegalArgumentException("This expense has already been deleted");
        cancellations.save(new ExpenseCancellation(original, user, "Replaced with a corrected expense record"));
        Expense replacement = new Expense(request.description(), request.amount().setScale(2, RoundingMode.UNNECESSARY), request.incurredOn(), request.category(), user);
        return ExpenseResponse.from(expenses.save(replacement));
    }

    @Transactional
    public void cancel(long id, String email) {
        AppUser user = user(email); Expense expense = expense(id, user);
        if (cancellations.existsByExpense(expense)) throw new IllegalArgumentException("This expense has already been deleted");
        cancellations.save(new ExpenseCancellation(expense, user, "Deleted from expense management"));
    }

    private AppUser user(String email) { return users.findByEmailIgnoreCase(email).orElseThrow(); }
    private Expense expense(long id, AppUser user) {
        Expense expense = expenses.findById(id).orElseThrow(() -> new IllegalArgumentException("Expense not found"));
        if (!expense.getCreatedBy().getBusiness().getId().equals(user.getBusiness().getId())) throw new IllegalArgumentException("Expense not found");
        return expense;
    }
}
