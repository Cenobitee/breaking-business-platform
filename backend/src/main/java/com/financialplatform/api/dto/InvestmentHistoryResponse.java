package com.financialplatform.api.dto;

import com.financialplatform.domain.InvestmentRemoval;
import com.financialplatform.domain.InvestmentTransaction;

import java.math.BigDecimal;
import java.time.Instant;

public record InvestmentHistoryResponse(
        Long id,
        BigDecimal amount,
        Instant investedAt,
        String approvedBy,
        String status,
        Instant removedAt,
        String removedBy
) {
    public static InvestmentHistoryResponse from(InvestmentTransaction transaction) {
        return from(transaction, null);
    }

    public static InvestmentHistoryResponse from(InvestmentTransaction transaction, InvestmentRemoval removal) {
        return new InvestmentHistoryResponse(
                transaction.getId(),
                transaction.getAmount(),
                transaction.getInvestedAt(),
                transaction.getApprovedBy().getFullName(),
                removal == null ? "INVESTED" : "REMOVED",
                removal == null ? null : removal.getRemovedAt(),
                removal == null ? null : removal.getRemovedBy().getFullName()
        );
    }
}
