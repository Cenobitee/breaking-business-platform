package com.financialplatform.service;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class ProductCatalogTest {
    private final ProductCatalog catalog = new ProductCatalog();

    @Test
    void grapePulpJuiceHasImmutableCatalogPrice() {
        var product = catalog.resolveProduct("  grape pulp juice ", new BigDecimal("130.00"));
        assertThat(product.name()).isEqualTo("Grape Pulp Juice");
        assertThat(product.unitPrice()).isEqualByComparingTo(new BigDecimal("130.00"));
    }

    @Test
    void customProductsUseTheSuppliedNameAndPrice() {
        var product = catalog.resolveProduct("  Mango Shake  ", new BigDecimal("175.00"));
        assertThat(product.name()).isEqualTo("Mango Shake");
        assertThat(product.unitPrice()).isEqualByComparingTo("175.00");
    }
}
