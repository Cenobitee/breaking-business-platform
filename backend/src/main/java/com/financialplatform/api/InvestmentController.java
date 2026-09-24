package com.financialplatform.api;

import com.financialplatform.api.dto.*;
import com.financialplatform.service.InvestmentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/investments")
public class InvestmentController {
    private final InvestmentService investmentService;

    public InvestmentController(InvestmentService investmentService) {
        this.investmentService = investmentService;
    }

    @PostMapping("/requests")
    public ResponseEntity<InvestmentRequestResponse> requestInvestment(
            @Valid @RequestBody CreateInvestmentRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(investmentService.requestInvestment(request.amount(), authentication.getName()));
    }

    @GetMapping("/me")
    public InvestorInvestmentsResponse myInvestments(Authentication authentication) {
        return investmentService.investorSummary(authentication.getName());
    }

    @GetMapping("/requests/pending")
    public List<InvestmentRequestResponse> pendingRequests(Authentication authentication) {
        return investmentService.pendingRequests(authentication.getName());
    }

    @PostMapping("/requests/{requestId}/approve")
    public InvestmentHistoryResponse approve(
            @PathVariable("requestId") long requestId,
            Authentication authentication
    ) {
        return investmentService.approve(requestId, authentication.getName());
    }

    @DeleteMapping("/requests/{requestId}")
    public ResponseEntity<Void> deletePendingRequest(
            @PathVariable("requestId") long requestId,
            Authentication authentication
    ) {
        investmentService.deletePendingRequest(requestId, authentication.getName());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/active")
    public List<OwnerInvestmentResponse> activeInvestments(Authentication authentication) {
        return investmentService.activeInvestments(authentication.getName());
    }

    @PostMapping("/{transactionId}/remove")
    public InvestmentHistoryResponse remove(
            @PathVariable("transactionId") long transactionId,
            Authentication authentication
    ) {
        return investmentService.remove(transactionId, authentication.getName());
    }

    @DeleteMapping("/history")
    public MessageResponse deleteAllHistory(Authentication authentication) {
        int deletedRecords = investmentService.deleteAllHistory(authentication.getName());
        return new MessageResponse("Investment history deleted permanently (" + deletedRecords + " records).");
    }
}
