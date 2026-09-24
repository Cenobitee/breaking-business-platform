package com.financialplatform.service;

import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Map;

@Component
public class ProductCatalog {
    private static final Map<String, Product> PRODUCTS = Map.of(
            "grape pulp juice", new Product("Grape Pulp Juice", new BigDecimal("130.00"))
    );

    public Product resolveProduct(String requestedName, BigDecimal suppliedPrice) {
        String cleanName = requestedName.trim();
        Product fixedProduct = PRODUCTS.get(cleanName.toLowerCase());
        if (fixedProduct != null) {
            if (suppliedPrice.compareTo(fixedProduct.unitPrice()) != 0) {
                throw new IllegalArgumentException(
                        fixedProduct.name() + " must be sold at exactly " + fixedProduct.unitPrice() + " BDT"
                );
            }
            return fixedProduct;
        }
        return new Product(cleanName, suppliedPrice);
    }

    public record Product(String name, BigDecimal unitPrice) {}
}
