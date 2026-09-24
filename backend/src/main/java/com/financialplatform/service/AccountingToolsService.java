package com.financialplatform.service;

import com.financialplatform.api.dto.*;
import com.financialplatform.domain.*;
import com.financialplatform.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.*;
import java.time.*;
import java.util.*;
import java.util.stream.Stream;

@Service
public class AccountingToolsService {
    private static final List<String> CATEGORIES = List.of("RENT","SALARIES","UTILITIES","MARKETING","SUPPLIES","TRANSPORT","OTHER");
    private final UserRepository users; private final SaleRepository sales; private final ExpenseRepository expenses; private final CatalogProductRepository products; private final ExpenseBudgetRepository budgets;
    public AccountingToolsService(UserRepository users, SaleRepository sales, ExpenseRepository expenses, CatalogProductRepository products, ExpenseBudgetRepository budgets) { this.users=users; this.sales=sales; this.expenses=expenses; this.products=products; this.budgets=budgets; }

    @Transactional(readOnly=true)
    public List<JournalEntryResponse> journal(String email) {
        AppUser user=user(email);
        Stream<JournalEntryResponse> saleLines=sales.findAllActive(user.getBusiness()).stream().map(s -> new JournalEntryResponse(s.getCreatedAt(),"SALE",s.getQuantity()+" x "+s.getItemName(),"Cash",s.getTotal(),"Sales Revenue",s.getTotal(),"Money came into the business because a customer bought products."));
        Stream<JournalEntryResponse> expenseLines=expenses.findActiveByBusiness(user.getBusiness()).stream().map(e -> new JournalEntryResponse(e.getCreatedAt(),"EXPENSE",e.getDescription(),title(e.getCategory())+" Expense",e.getAmount(),"Cash",e.getAmount(),"Money left the business to pay for "+e.getDescription()+"."));
        return Stream.concat(saleLines,expenseLines).sorted(Comparator.comparing(JournalEntryResponse::occurredAt).reversed()).toList();
    }

    @Transactional(readOnly=true)
    public BreakEvenResponse breakEven(BreakEvenRequest request,String email) {
        AppUser user=user(email); CatalogProduct product=products.findById(request.productId()).orElseThrow(() -> new IllegalArgumentException("Product not found"));
        if(!product.getBusiness().getId().equals(user.getBusiness().getId())) throw new IllegalArgumentException("Product not found");
        BigDecimal contribution=product.getUnitPrice().subtract(product.getUnitCost()).setScale(2);
        if(contribution.signum()<=0) return new BreakEvenResponse(product.getName(),product.getUnitPrice(),product.getUnitCost(),contribution,0,request.expectedUnits(),contribution.multiply(BigDecimal.valueOf(request.expectedUnits())).subtract(request.fixedCosts()),"The selling price must be higher than the cost per item before this product can cover fixed costs.");
        int units=request.fixedCosts().divide(contribution,0,RoundingMode.CEILING).intValueExact();
        BigDecimal expected=contribution.multiply(BigDecimal.valueOf(request.expectedUnits())).subtract(request.fixedCosts()).setScale(2);
        return new BreakEvenResponse(product.getName(),product.getUnitPrice(),product.getUnitCost(),contribution,units,request.expectedUnits(),expected,"After selling "+units+" units, this product has covered the entered fixed costs. Units sold after that begin producing profit.");
    }

    @Transactional
    public BudgetStatusResponse setBudget(BudgetRequest request,String email) {
        AppUser user=user(email); LocalDate month=YearMonth.parse(request.month()).atDay(1);
        ExpenseBudget budget=budgets.findByBusinessAndCategoryAndBudgetMonth(user.getBusiness(),request.category(),month).orElseGet(() -> new ExpenseBudget(user.getBusiness(),request.category(),month,request.amount(),user));
        budget.update(request.amount().setScale(2,RoundingMode.UNNECESSARY),user); budgets.save(budget);
        return status(budget,actual(user,request.category(),month));
    }

    @Transactional(readOnly=true)
    public List<BudgetStatusResponse> budgetStatus(String monthText,String email) {
        AppUser user=user(email); LocalDate month=YearMonth.parse(monthText).atDay(1);
        Map<String,ExpenseBudget> saved=new HashMap<>(); budgets.findByBusinessAndBudgetMonthOrderByCategory(user.getBusiness(),month).forEach(b -> saved.put(b.getCategory(),b));
        return CATEGORIES.stream().map(category -> { ExpenseBudget b=saved.get(category); BigDecimal actual=actual(user,category,month); return b==null ? new BudgetStatusResponse(null,category,BigDecimal.ZERO.setScale(2),actual,actual.negate(),"NO_BUDGET") : status(b,actual); }).toList();
    }

    @Transactional public void deleteBudget(long id,String email) { AppUser user=user(email); ExpenseBudget budget=budgets.findById(id).orElseThrow(() -> new IllegalArgumentException("Budget not found")); if(!budget.getBusiness().getId().equals(user.getBusiness().getId())) throw new IllegalArgumentException("Budget not found"); budgets.delete(budget); }
    private BudgetStatusResponse status(ExpenseBudget b,BigDecimal actual){BigDecimal remaining=b.getAmount().subtract(actual).setScale(2); return new BudgetStatusResponse(b.getId(),b.getCategory(),b.getAmount(),actual,remaining,remaining.signum()>=0?"WITHIN_BUDGET":"OVER_BUDGET");}
    private BigDecimal actual(AppUser user,String category,LocalDate month){YearMonth ym=YearMonth.from(month); return expenses.findActiveByBusiness(user.getBusiness()).stream().filter(e -> e.getCategory().equals(category)&&YearMonth.from(e.getIncurredOn()).equals(ym)).map(Expense::getAmount).reduce(BigDecimal.ZERO,BigDecimal::add).setScale(2);}
    private AppUser user(String email){return users.findByEmailIgnoreCase(email).orElseThrow();}
    private String title(String value){String lower=value.toLowerCase(); return Character.toUpperCase(lower.charAt(0))+lower.substring(1);}
}
