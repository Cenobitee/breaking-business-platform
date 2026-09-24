package com.financialplatform.domain;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "catalog_products")
public class CatalogProduct {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "business_id", nullable = false, updatable = false) private Business business;
    @Column(nullable = false, length = 120) private String name;
    @Column(name = "unit_price", nullable = false, precision = 12, scale = 2) private BigDecimal unitPrice;
    @Column(name = "unit_cost", nullable = false, precision = 12, scale = 2) private BigDecimal unitCost = BigDecimal.ZERO;
    @Column(name = "stock_quantity", nullable = false) private int stockQuantity;
    @Column(name = "low_stock_threshold", nullable = false) private int lowStockThreshold;
    @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt = Instant.now();

    protected CatalogProduct() {}
    public CatalogProduct(Business business, String name, BigDecimal unitPrice, BigDecimal unitCost, int stockQuantity, int lowStockThreshold) { this.business = business; update(name, unitPrice, unitCost, stockQuantity, lowStockThreshold); }
    public void update(String name, BigDecimal unitPrice, BigDecimal unitCost, int stockQuantity, int lowStockThreshold) { this.name = name.trim(); this.unitPrice = unitPrice; this.unitCost = unitCost; this.stockQuantity = stockQuantity; this.lowStockThreshold = lowStockThreshold; }
    public void sell(int quantity) { if (quantity > stockQuantity) throw new IllegalArgumentException("Only " + stockQuantity + " item(s) are currently in stock"); stockQuantity -= quantity; }
    public void restore(int quantity) { stockQuantity += quantity; }
    public Long getId() { return id; }
    public Business getBusiness() { return business; }
    public String getName() { return name; }
    public BigDecimal getUnitPrice() { return unitPrice; }
    public BigDecimal getUnitCost() { return unitCost; }
    public int getStockQuantity() { return stockQuantity; }
    public int getLowStockThreshold() { return lowStockThreshold; }
    public Instant getCreatedAt() { return createdAt; }
}
