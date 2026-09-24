package com.financialplatform.api;
import com.financialplatform.api.dto.*;
import com.financialplatform.service.AccountingToolsService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController @RequestMapping("/api/accounting")
public class AccountingToolsController {
    private final AccountingToolsService accounting;
    public AccountingToolsController(AccountingToolsService accounting){this.accounting=accounting;}
    @GetMapping("/journal") public List<JournalEntryResponse> journal(Authentication auth){return accounting.journal(auth.getName());}
    @PostMapping("/break-even") public BreakEvenResponse breakEven(@Valid @RequestBody BreakEvenRequest request,Authentication auth){return accounting.breakEven(request,auth.getName());}
    @GetMapping("/budgets") public List<BudgetStatusResponse> budgets(@RequestParam String month,Authentication auth){return accounting.budgetStatus(month,auth.getName());}
    @PostMapping("/budgets") @ResponseStatus(HttpStatus.CREATED) public BudgetStatusResponse setBudget(@Valid @RequestBody BudgetRequest request,Authentication auth){return accounting.setBudget(request,auth.getName());}
    @DeleteMapping("/budgets/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) public void deleteBudget(@PathVariable long id,Authentication auth){accounting.deleteBudget(id,auth.getName());}
}
