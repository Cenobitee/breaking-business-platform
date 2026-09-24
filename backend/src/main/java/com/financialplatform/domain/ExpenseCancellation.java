package com.financialplatform.domain;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "expense_cancellations")
public class ExpenseCancellation {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "expense_id", nullable = false, unique = true, updatable = false) private Expense expense;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cancelled_by", nullable = false, updatable = false) private AppUser cancelledBy;
    @Column(nullable = false, updatable = false, length = 240) private String reason;
    @Column(name = "cancelled_at", nullable = false, updatable = false) private Instant cancelledAt = Instant.now();

    protected ExpenseCancellation() {}
    public ExpenseCancellation(Expense expense, AppUser cancelledBy, String reason) {
        this.expense = expense; this.cancelledBy = cancelledBy; this.reason = reason;
    }
}
