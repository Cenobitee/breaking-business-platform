package com.financialplatform.domain;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "investment_requests")
public class InvestmentRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "investor_id", nullable = false, updatable = false)
    private AppUser investor;

    @Column(nullable = false, updatable = false, precision = 16, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private InvestmentRequestStatus status = InvestmentRequestStatus.PENDING;

    @Column(name = "requested_at", nullable = false, updatable = false)
    private Instant requestedAt = Instant.now();

    @Column(name = "approved_at")
    private Instant approvedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by")
    private AppUser approvedBy;

    protected InvestmentRequest() {}

    public InvestmentRequest(AppUser investor, BigDecimal amount) {
        this.investor = investor;
        this.amount = amount;
    }

    public Long getId() { return id; }
    public AppUser getInvestor() { return investor; }
    public BigDecimal getAmount() { return amount; }
    public InvestmentRequestStatus getStatus() { return status; }
    public Instant getRequestedAt() { return requestedAt; }
    public Instant getApprovedAt() { return approvedAt; }
    public AppUser getApprovedBy() { return approvedBy; }

    public void approve(AppUser owner, Instant instant) {
        if (status != InvestmentRequestStatus.PENDING) {
            throw new IllegalArgumentException("This investment request has already been processed");
        }
        status = InvestmentRequestStatus.APPROVED;
        approvedBy = owner;
        approvedAt = instant;
    }
}
