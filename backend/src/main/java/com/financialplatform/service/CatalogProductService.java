package com.financialplatform.service;

import com.financialplatform.api.dto.ProductRequest;
import com.financialplatform.api.dto.ProductResponse;
import com.financialplatform.domain.AppUser;
import com.financialplatform.domain.CatalogProduct;
import com.financialplatform.repository.CatalogProductRepository;
import com.financialplatform.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.RoundingMode;
import java.util.List;

@Service
public class CatalogProductService {
    private final CatalogProductRepository products; private final UserRepository users; private final ProductCatalog pricingRules;
    public CatalogProductService(CatalogProductRepository products, UserRepository users, ProductCatalog pricingRules) { this.products = products; this.users = users; this.pricingRules = pricingRules; }
    @Transactional(readOnly = true) public List<ProductResponse> list(String email) { AppUser user = user(email); return products.findByBusinessOrderByName(user.getBusiness()).stream().map(ProductResponse::from).toList(); }
    @Transactional public ProductResponse create(ProductRequest request, String email) {
        AppUser user = user(email); ProductCatalog.Product validated = pricingRules.resolveProduct(request.name(), request.unitPrice().setScale(2, RoundingMode.UNNECESSARY)); String name = validated.name();
        if (products.existsByBusinessAndNameIgnoreCase(user.getBusiness(), name)) throw new IllegalArgumentException("This product already exists");
        return ProductResponse.from(products.save(new CatalogProduct(user.getBusiness(), name, validated.unitPrice(), request.unitCost(), request.stockQuantity(), request.lowStockThreshold())));
    }
    @Transactional public ProductResponse update(long id, ProductRequest request, String email) {
        AppUser user = user(email); CatalogProduct product = product(id, user); ProductCatalog.Product validated = pricingRules.resolveProduct(request.name(), request.unitPrice().setScale(2, RoundingMode.UNNECESSARY)); String name = validated.name();
        if (products.existsByBusinessAndNameIgnoreCaseAndIdNot(user.getBusiness(), name, id)) throw new IllegalArgumentException("This product already exists");
        product.update(name, validated.unitPrice(), request.unitCost(), request.stockQuantity(), request.lowStockThreshold()); return ProductResponse.from(product);
    }
    @Transactional public void delete(long id, String email) { AppUser user = user(email); products.delete(product(id, user)); }
    private AppUser user(String email) { return users.findByEmailIgnoreCase(email).orElseThrow(); }
    private CatalogProduct product(long id, AppUser user) { CatalogProduct product = products.findById(id).orElseThrow(() -> new IllegalArgumentException("Product not found")); if (!product.getBusiness().getId().equals(user.getBusiness().getId())) throw new IllegalArgumentException("Product not found"); return product; }
}
