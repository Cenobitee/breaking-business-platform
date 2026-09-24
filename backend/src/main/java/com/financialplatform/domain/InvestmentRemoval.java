package com.financialplatform.domain;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "investment_removals")
public class InvestmentRemoval {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "transaction_id", nullable = false, unique = true, updatable = false)
    private InvestmentTransaction transaction;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "investor_id", nullable = false, updatable = false)
    private AppUser investor;

    @Column(nullable = false, updatable = false, precision = 16, scale = 2)
    private BigDecimal amount;

    @Column(name = "removed_at", nullable = false, updatable = false)
    private Instant removedAt;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "removed_by", nullable = false, updatable = false)
    private AppUser removedBy;

    protected InvestmentRemoval() {}

    public InvestmentRemoval(InvestmentTransaction transaction, AppUser owner, Instant removedAt) {
        this.transaction = transaction;
        this.investor = transaction.getInvestor();
        this.amount = transaction.getAmount();
        this.removedAt = removedAt;
        this.removedBy = owner;
    }

    public Long getId() { return id; }
    public InvestmentTransaction getTransaction() { return transaction; }
    public Instant getRemovedAt() { return removedAt; }
    public AppUser getRemovedBy() { return removedBy; }
}
