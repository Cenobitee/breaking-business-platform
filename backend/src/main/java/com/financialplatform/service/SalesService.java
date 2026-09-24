package com.financialplatform.service;

import com.financialplatform.api.dto.CreateSaleRequest;
import com.financialplatform.api.dto.SaleResponse;
import com.financialplatform.domain.AppUser;
import com.financialplatform.domain.Sale;
import com.financialplatform.domain.SaleCancellation;
import com.financialplatform.repository.SaleCancellationRepository;
import com.financialplatform.repository.SaleRepository;
import com.financialplatform.repository.UserRepository;
import com.financialplatform.repository.CatalogProductRepository;
import com.financialplatform.domain.CatalogProduct;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.PageRequest;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.time.LocalDate;
import java.time.ZoneId;

@Service
public class SalesService {
    private final ProductCatalog catalog;
    private final SaleRepository sales;
    private final SaleCancellationRepository cancellations;
    private final UserRepository users;
    private final CatalogProductRepository products;

    public SalesService(
            ProductCatalog catalog,
            SaleRepository sales,
            SaleCancellationRepository cancellations,
            UserRepository users,
            CatalogProductRepository products
    ) {
        this.catalog = catalog;
        this.sales = sales;
        this.cancellations = cancellations;
        this.users = users;
        this.products = products;
    }

    @Transactional
    public SaleResponse create(CreateSaleRequest request, String userEmail) {
        String productName;
        BigDecimal unitPrice;
        ProductCatalog.Product legacyProduct = null;
        CatalogProduct catalogProduct = null;
        if (request.productId() == null) {
            if (request.itemName() == null || request.itemName().isBlank() || request.unitPrice() == null) throw new IllegalArgumentException("Select a catalog product");
            BigDecimal suppliedPrice = request.unitPrice().setScale(2, RoundingMode.UNNECESSARY);
            legacyProduct = catalog.resolveProduct(request.itemName(), suppliedPrice);
        }
        AppUser operator = users.findByEmailIgnoreCase(userEmail).orElseThrow();
        if (request.productId() != null) {
            catalogProduct = products.findById(request.productId()).orElseThrow(() -> new IllegalArgumentException("Product not found"));
            if (!catalogProduct.getBusiness().getId().equals(operator.getBusiness().getId())) throw new IllegalArgumentException("Product not found");
            catalogProduct.sell(request.quantity());
            productName = catalogProduct.getName(); unitPrice = catalogProduct.getUnitPrice();
        } else {
            productName = legacyProduct.name(); unitPrice = legacyProduct.unitPrice();
        }
        BigDecimal total = unitPrice.multiply(BigDecimal.valueOf(request.quantity()));
        Sale sale = sales.save(new Sale(productName, request.quantity(), unitPrice, total, operator, catalogProduct));
        return SaleResponse.from(sale);
    }

    @Transactional(readOnly = true)
    public List<SaleResponse> recent(String userEmail) {
        AppUser user = users.findByEmailIgnoreCase(userEmail).orElseThrow();
        return sales.findRecentActive(user.getBusiness(), PageRequest.of(0, 50)).stream().map(SaleResponse::from).toList();
    }

    @Transactional
    public void cancel(long saleId, String userEmail) {
        Sale sale = sales.findById(saleId)
                .orElseThrow(() -> new IllegalArgumentException("Sale not found"));
        if (cancellations.existsBySale(sale)) {
            throw new IllegalArgumentException("This sale has already been deleted");
        }
        AppUser user = users.findByEmailIgnoreCase(userEmail).orElseThrow();
        if (!sale.getCreatedBy().getBusiness().getId().equals(user.getBusiness().getId())) {
            throw new IllegalArgumentException("Sale not found");
        }
        cancelSale(sale, user, "Deleted by " + user.getRole().name().toLowerCase() + " from the sales report");
    }

    @Transactional
    public int cancelToday(String userEmail) {
        AppUser user = users.findByEmailIgnoreCase(userEmail).orElseThrow();
        ZoneId zone = ZoneId.of("Asia/Dhaka");
        LocalDate today = LocalDate.now(zone);
        var start = today.atStartOfDay(zone).toInstant();
        var end = today.plusDays(1).atStartOfDay(zone).toInstant();
        List<Sale> todaysSales = sales.findActiveBetween(user.getBusiness(), start, end);
        todaysSales.forEach(sale -> cancelSale(sale, user, "Bulk-deleted from today's order history"));
        return todaysSales.size();
    }

    private void cancelSale(Sale sale, AppUser user, String reason) {
        cancellations.save(new SaleCancellation(sale, user, reason));
        if (sale.getProduct() != null) sale.getProduct().restore(sale.getQuantity());
    }
}
