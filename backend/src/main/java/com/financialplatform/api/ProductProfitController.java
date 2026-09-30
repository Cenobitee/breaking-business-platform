package com.financialplatform.api;

import com.financialplatform.api.dto.ProductProfitResponse;
import com.financialplatform.api.dto.UpdateProductCostRequest;
import com.financialplatform.service.ProductProfitService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/product-profits")
public class ProductProfitController {
  private final ProductProfitService productProfits;

  public ProductProfitController(ProductProfitService productProfits) {
    this.productProfits = productProfits;
  }

  @GetMapping
  public List<ProductProfitResponse> list(Authentication auth) {
    return productProfits.list(auth.getName());
  }

  @PatchMapping("/{productId}/base-cost")
  public ProductProfitResponse updateBaseCost(
      @PathVariable long productId,
      @Valid @RequestBody UpdateProductCostRequest request,
      Authentication auth) {
    return productProfits.updateBaseCost(productId, request.baseCost(), auth.getName());
  }
}
