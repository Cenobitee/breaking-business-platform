package com.financialplatform.api.dto;

import com.financialplatform.domain.InvestmentRequest;
import com.financialplatform.domain.InvestmentRequestStatus;

import java.math.BigDecimal;
import java.time.Instant;

public record InvestmentRequestResponse(
        Long id,
        String investorName,
        String investorEmail,
        BigDecimal amount,
        InvestmentRequestStatus status,
        Instant requestedAt,
        Instant approvedAt
) {
    public static InvestmentRequestResponse from(InvestmentRequest request) {
        return new InvestmentRequestResponse(
                request.getId(),
                request.getInvestor().getFullName(),
                request.getInvestor().getEmail(),
                request.getAmount(),
                request.getStatus(),
                request.getRequestedAt(),
                request.getApprovedAt()
        );
    }
}
