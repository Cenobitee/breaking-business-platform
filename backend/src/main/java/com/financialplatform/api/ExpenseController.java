package com.financialplatform.api;

import com.financialplatform.api.dto.*;
import com.financialplatform.service.ExpenseService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/expenses")
public class ExpenseController {
    private final ExpenseService expenses;
    public ExpenseController(ExpenseService expenses) { this.expenses = expenses; }

    @GetMapping public List<ExpenseResponse> list(Authentication auth) { return expenses.list(auth.getName()); }
    @GetMapping("/{id}") public ExpenseResponse get(@PathVariable long id, Authentication auth) { return expenses.get(id, auth.getName()); }
    @PostMapping @ResponseStatus(HttpStatus.CREATED)
    public ExpenseResponse create(@Valid @RequestBody ExpenseRequest request, Authentication auth) { return expenses.create(request, auth.getName()); }
    @PutMapping("/{id}")
    public ExpenseResponse update(@PathVariable long id, @Valid @RequestBody ExpenseRequest request, Authentication auth) { return expenses.update(id, request, auth.getName()); }
    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable long id, Authentication auth) { expenses.cancel(id, auth.getName()); }
}
