package com.financialplatform.domain;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "investors")
public class InvestorPosition {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private AppUser user;

    @Column(name = "initial_capital", nullable = false, precision = 16, scale = 2)
    private BigDecimal initialCapital;

    @Column(name = "equity_percentage", nullable = false, precision = 7, scale = 4)
    private BigDecimal equityPercentage;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected InvestorPosition() {}
}
