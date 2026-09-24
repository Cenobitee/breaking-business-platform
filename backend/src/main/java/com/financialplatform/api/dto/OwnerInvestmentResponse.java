package com.financialplatform.api.dto;

import com.financialplatform.domain.InvestmentTransaction;

import java.math.BigDecimal;
import java.time.Instant;

public record OwnerInvestmentResponse(
        Long id,
        String investorName,
        String investorEmail,
        BigDecimal amount,
        Instant investedAt
) {
    public static OwnerInvestmentResponse from(InvestmentTransaction transaction) {
        return new OwnerInvestmentResponse(
                transaction.getId(),
                transaction.getInvestor().getFullName(),
                transaction.getInvestor().getEmail(),
                transaction.getAmount(),
                transaction.getInvestedAt()
        );
    }
}
