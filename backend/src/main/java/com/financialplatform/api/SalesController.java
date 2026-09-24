package com.financialplatform.api;

import com.financialplatform.api.dto.CreateSaleRequest;
import com.financialplatform.api.dto.SaleResponse;
import com.financialplatform.api.dto.BulkDeleteSalesResponse;
import com.financialplatform.service.SalesService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sales")
public class SalesController {
    private final SalesService salesService;

    public SalesController(SalesService salesService) {
        this.salesService = salesService;
    }

    @PostMapping
    public ResponseEntity<SaleResponse> create(
            @Valid @RequestBody CreateSaleRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(salesService.create(request, authentication.getName()));
    }

    @GetMapping
    public List<SaleResponse> recent(Authentication authentication) {
        return salesService.recent(authentication.getName());
    }

    @DeleteMapping("/{saleId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void cancel(@PathVariable("saleId") long saleId, Authentication authentication) {
        salesService.cancel(saleId, authentication.getName());
    }

    @DeleteMapping("/today")
    public BulkDeleteSalesResponse cancelToday(Authentication authentication) {
        return new BulkDeleteSalesResponse(salesService.cancelToday(authentication.getName()));
    }
}
