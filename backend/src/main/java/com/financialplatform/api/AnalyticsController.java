package com.financialplatform.api;

import com.financialplatform.api.dto.InvestorAnalyticsResponse;
import com.financialplatform.api.dto.OperationsAnalyticsResponse;
import com.financialplatform.service.AnalyticsService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.core.Authentication;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {
    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/operations")
    public OperationsAnalyticsResponse operations(Authentication authentication) {
        return analyticsService.operationsToday(authentication.getName());
    }

    @GetMapping("/investor")
    public InvestorAnalyticsResponse investor(Authentication authentication) {
        return analyticsService.investorSummary(authentication.getName());
    }
}
