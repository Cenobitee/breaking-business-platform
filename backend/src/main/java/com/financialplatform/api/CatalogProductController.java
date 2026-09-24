package com.financialplatform.api;

import com.financialplatform.api.dto.ProductRequest;
import com.financialplatform.api.dto.ProductResponse;
import com.financialplatform.service.CatalogProductService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController @RequestMapping("/api/products")
public class CatalogProductController {
    private final CatalogProductService products;
    public CatalogProductController(CatalogProductService products) { this.products = products; }
    @GetMapping public List<ProductResponse> list(Authentication auth) { return products.list(auth.getName()); }
    @PostMapping @ResponseStatus(HttpStatus.CREATED) public ProductResponse create(@Valid @RequestBody ProductRequest request, Authentication auth) { return products.create(request, auth.getName()); }
    @PutMapping("/{id}") public ProductResponse update(@PathVariable long id, @Valid @RequestBody ProductRequest request, Authentication auth) { return products.update(id, request, auth.getName()); }
    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) public void delete(@PathVariable long id, Authentication auth) { products.delete(id, auth.getName()); }
}
