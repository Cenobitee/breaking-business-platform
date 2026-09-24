package com.financialplatform.domain;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.*;

@Entity @Table(name = "expense_budgets")
public class ExpenseBudget {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "business_id", nullable = false) private Business business;
    @Column(nullable = false, length = 40) private String category;
    @Column(name = "budget_month", nullable = false) private LocalDate budgetMonth;
    @Column(nullable = false, precision = 14, scale = 2) private BigDecimal amount;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "created_by", nullable = false) private AppUser createdBy;
    @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt = Instant.now();
    protected ExpenseBudget() {}
    public ExpenseBudget(Business business, String category, LocalDate budgetMonth, BigDecimal amount, AppUser createdBy) { this.business=business; this.category=category; this.budgetMonth=budgetMonth; this.amount=amount; this.createdBy=createdBy; }
    public void update(BigDecimal amount, AppUser user) { this.amount=amount; this.createdBy=user; }
    public Long getId(){return id;} public Business getBusiness(){return business;} public String getCategory(){return category;} public LocalDate getBudgetMonth(){return budgetMonth;} public BigDecimal getAmount(){return amount;}
}
