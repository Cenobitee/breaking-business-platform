package com.financialplatform.domain;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "investment_transactions")
public class InvestmentTransaction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "request_id", nullable = false, unique = true, updatable = false)
    private InvestmentRequest request;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "investor_id", nullable = false, updatable = false)
    private AppUser investor;

    @Column(nullable = false, updatable = false, precision = 16, scale = 2)
    private BigDecimal amount;

    @Column(name = "invested_at", nullable = false, updatable = false)
    private Instant investedAt;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "approved_by", nullable = false, updatable = false)
    private AppUser approvedBy;

    protected InvestmentTransaction() {}

    public InvestmentTransaction(InvestmentRequest request, AppUser owner, Instant investedAt) {
        this.request = request;
        this.investor = request.getInvestor();
        this.amount = request.getAmount();
        this.investedAt = investedAt;
        this.approvedBy = owner;
    }

    public Long getId() { return id; }
    public AppUser getInvestor() { return investor; }
    public BigDecimal getAmount() { return amount; }
    public Instant getInvestedAt() { return investedAt; }
    public AppUser getApprovedBy() { return approvedBy; }
}
