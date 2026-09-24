package com.financialplatform.domain;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "sales")
public class Sale {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "item_name", nullable = false, updatable = false, length = 120)
    private String itemName;

    @Column(nullable = false, updatable = false)
    private int quantity;

    @Column(name = "unit_price", nullable = false, updatable = false, precision = 12, scale = 2)
    private BigDecimal unitPrice;

    @Column(nullable = false, updatable = false, precision = 14, scale = 2)
    private BigDecimal total;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by", nullable = false, updatable = false)
    private AppUser createdBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", updatable = false)
    private CatalogProduct product;

    protected Sale() {}

    public Sale(String itemName, int quantity, BigDecimal unitPrice, BigDecimal total, AppUser createdBy) {
        this(itemName, quantity, unitPrice, total, createdBy, null);
    }

    public Sale(String itemName, int quantity, BigDecimal unitPrice, BigDecimal total, AppUser createdBy, CatalogProduct product) {
        this.itemName = itemName;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
        this.total = total;
        this.createdBy = createdBy;
        this.product = product;
    }

    public Long getId() { return id; }
    public String getItemName() { return itemName; }
    public int getQuantity() { return quantity; }
    public BigDecimal getUnitPrice() { return unitPrice; }
    public BigDecimal getTotal() { return total; }
    public Instant getCreatedAt() { return createdAt; }
    public AppUser getCreatedBy() { return createdBy; }
    public CatalogProduct getProduct() { return product; }
}
