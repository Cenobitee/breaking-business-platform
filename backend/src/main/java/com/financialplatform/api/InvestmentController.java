package com.financialplatform.api;

import com.financialplatform.api.dto.*;
import com.financialplatform.service.InvestmentService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/investments")
public class InvestmentController {
  private final InvestmentService investmentService;

  public InvestmentController(InvestmentService investmentService) {
    this.investmentService = investmentService;
  }

  @PostMapping("/requests")
  public ResponseEntity<InvestmentRequestResponse> requestInvestment(
      @Valid @RequestBody CreateInvestmentRequest request, Authentication authentication) {
    return ResponseEntity.status(HttpStatus.CREATED)
        .body(
            investmentService.requestInvestment(
                request.packageId(), request.quantity(), authentication.getName()));
  }

  @GetMapping("/me")
  public InvestorInvestmentsResponse myInvestments(Authentication authentication) {
    return investmentService.investorSummary(authentication.getName());
  }

  @GetMapping("/packages")
  public List<InvestmentPackageResponse> packages(Authentication authentication) {
    return investmentService.investmentPackages(authentication.getName());
  }

  @PutMapping("/packages/{packageId}")
  public InvestmentPackageResponse updatePackage(
      @PathVariable long packageId,
      @Valid @RequestBody UpdateInvestmentPackageRequest request,
      Authentication authentication) {
    return investmentService.updatePackage(packageId, request, authentication.getName());
  }

  @PostMapping("/packages")
  @ResponseStatus(HttpStatus.CREATED)
  public InvestmentPackageResponse createPackage(
      @Valid @RequestBody CreateInvestmentPackageRequest request,
      Authentication authentication) {
    return investmentService.createPackage(request, authentication.getName());
  }

  @DeleteMapping("/packages/{packageId}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void deletePackage(
      @PathVariable long packageId, Authentication authentication) {
    investmentService.deletePackage(packageId, authentication.getName());
  }

  @GetMapping("/requests/pending")
  public List<InvestmentRequestResponse> pendingRequests(Authentication authentication) {
    return investmentService.pendingRequests(authentication.getName());
  }

  @PostMapping("/requests/{requestId}/approve")
  public InvestmentHistoryResponse approve(
      @PathVariable("requestId") long requestId, Authentication authentication) {
    return investmentService.approve(requestId, authentication.getName());
  }

  @DeleteMapping("/requests/{requestId}")
  public ResponseEntity<Void> deletePendingRequest(
      @PathVariable("requestId") long requestId, Authentication authentication) {
    investmentService.deletePendingRequest(requestId, authentication.getName());
    return ResponseEntity.noContent().build();
  }

  @GetMapping("/active")
  public List<OwnerInvestmentResponse> activeInvestments(Authentication authentication) {
    return investmentService.activeInvestments(authentication.getName());
  }

  @GetMapping("/cycles")
  public List<InvestmentCycleResponse> cycles(Authentication authentication) {
    return investmentService.businessCycles(authentication.getName());
  }

  @PostMapping("/cycles/{cycleId}/complete")
  public InvestmentCycleResponse completeCycle(
      @PathVariable long cycleId, Authentication authentication) {
    return investmentService.completeCycle(cycleId, authentication.getName());
  }

  @PostMapping("/cycles/{cycleId}/withdraw")
  public InvestmentCycleResponse withdrawMaturedInvestment(
      @PathVariable long cycleId, Authentication authentication) {
    return investmentService.withdrawMaturedInvestment(cycleId, authentication.getName());
  }

  @PostMapping("/{transactionId}/remove")
  public InvestmentHistoryResponse remove(
      @PathVariable("transactionId") long transactionId, Authentication authentication) {
    return investmentService.remove(transactionId, authentication.getName());
  }

  @DeleteMapping("/history")
  public MessageResponse deleteAllHistory(Authentication authentication) {
    int deletedRecords = investmentService.deleteAllHistory(authentication.getName());
    return new MessageResponse(
        "Investment history deleted permanently (" + deletedRecords + " records).");
  }
}
