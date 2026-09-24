package com.financialplatform.api.dto;

import java.math.BigDecimal;
import java.util.List;

public record InvestorInvestmentsResponse(
        BigDecimal totalInvested,
        List<InvestmentRequestResponse> requests,
        List<InvestmentHistoryResponse> history
) {}
