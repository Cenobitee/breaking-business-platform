package com.financialplatform.service;

import com.financialplatform.api.dto.ProductProfitResponse;
import com.financialplatform.domain.AppUser;
import com.financialplatform.domain.CatalogProduct;
import com.financialplatform.domain.Sale;
import com.financialplatform.repository.CatalogProductRepository;
import com.financialplatform.repository.SaleRepository;
import com.financialplatform.repository.UserRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProductProfitService {
  private final CatalogProductRepository products;
  private final SaleRepository sales;
  private final UserRepository users;

  public ProductProfitService(
      CatalogProductRepository products, SaleRepository sales, UserRepository users) {
    this.products = products;
    this.sales = sales;
    this.users = users;
  }

  @Transactional(readOnly = true)
  public List<ProductProfitResponse> list(String ownerEmail) {
    AppUser owner = owner(ownerEmail);
    List<Sale> activeSales = sales.findAllActive(owner.getBusiness());
    return products.findByBusinessOrderByName(owner.getBusiness()).stream()
        .map(product -> response(product, activeSales))
        .toList();
  }

  @Transactional
  public ProductProfitResponse updateBaseCost(
      long productId, BigDecimal baseCost, String ownerEmail) {
    AppUser owner = owner(ownerEmail);
    CatalogProduct product = products.findById(productId)
        .filter(item -> item.getBusiness().getId().equals(owner.getBusiness().getId()))
        .orElseThrow(() -> new IllegalArgumentException("Product not found"));
    product.updateBaseCost(baseCost.setScale(2, RoundingMode.UNNECESSARY));
    return response(product, sales.findAllActive(owner.getBusiness()));
  }

  private ProductProfitResponse response(CatalogProduct product, List<Sale> activeSales) {
    List<Sale> productSales = activeSales.stream()
        .filter(sale -> sale.getProduct() != null && sale.getProduct().getId().equals(product.getId()))
        .toList();
    long unitsSold = productSales.stream().mapToLong(Sale::getQuantity).sum();
    BigDecimal revenue = productSales.stream()
        .map(Sale::getTotal)
        .reduce(BigDecimal.ZERO, BigDecimal::add);
    BigDecimal cost = productSales.stream()
        .map(sale -> sale.getUnitCostSnapshot().multiply(BigDecimal.valueOf(sale.getQuantity())))
        .reduce(BigDecimal.ZERO, BigDecimal::add);
    return new ProductProfitResponse(
        product.getId(), product.getName(), product.getUnitPrice(), product.getUnitCost(),
        product.getUnitPrice().subtract(product.getUnitCost()), unitsSold, revenue, cost,
        revenue.subtract(cost));
  }

  private AppUser owner(String email) {
    AppUser user = users.findByEmailIgnoreCase(email).orElseThrow();
    if (!"OWNER".equals(user.getRole().name())) {
      throw new IllegalArgumentException("Owner access is required");
    }
    return user;
  }
}
