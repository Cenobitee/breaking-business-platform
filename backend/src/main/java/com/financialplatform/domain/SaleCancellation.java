package com.financialplatform.domain;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "sale_cancellations")
public class SaleCancellation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sale_id", nullable = false, unique = true, updatable = false)
    private Sale sale;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cancelled_by", nullable = false, updatable = false)
    private AppUser cancelledBy;

    @Column(nullable = false, updatable = false, length = 240)
    private String reason;

    @Column(name = "cancelled_at", nullable = false, updatable = false)
    private Instant cancelledAt = Instant.now();

    protected SaleCancellation() {}

    public SaleCancellation(Sale sale, AppUser cancelledBy, String reason) {
        this.sale = sale;
        this.cancelledBy = cancelledBy;
        this.reason = reason;
    }
}
