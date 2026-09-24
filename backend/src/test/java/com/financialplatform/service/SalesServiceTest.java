package com.financialplatform.service;

import com.financialplatform.api.dto.CreateSaleRequest;
import com.financialplatform.domain.AppUser;
import com.financialplatform.domain.Role;
import com.financialplatform.domain.Sale;
import com.financialplatform.repository.SaleRepository;
import com.financialplatform.repository.SaleCancellationRepository;
import com.financialplatform.repository.UserRepository;
import com.financialplatform.repository.CatalogProductRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SalesServiceTest {
    @Mock SaleRepository sales;
    @Mock SaleCancellationRepository cancellations;
    @Mock UserRepository users;
    @Mock CatalogProductRepository products;

    @Test
    void serverCalculatesTheSaleTotal() {
        var service = new SalesService(new ProductCatalog(), sales, cancellations, users, products);
        var operator = new AppUser("Manager", "manager@example.com", "hash", Role.MANAGER);
        when(users.findByEmailIgnoreCase("manager@example.com")).thenReturn(Optional.of(operator));
        when(sales.save(any(Sale.class))).thenAnswer(invocation -> invocation.getArgument(0));

        service.create(
                new CreateSaleRequest("Grape Pulp Juice", 3, new BigDecimal("130.00")),
                "manager@example.com"
        );

        ArgumentCaptor<Sale> captor = ArgumentCaptor.forClass(Sale.class);
        verify(sales).save(captor.capture());
        assertThat(captor.getValue().getTotal()).isEqualByComparingTo("390.00");
    }

    @Test
    void rejectsClientPriceTampering() {
        var service = new SalesService(new ProductCatalog(), sales, cancellations, users, products);
        var request = new CreateSaleRequest("Grape Pulp Juice", 1, new BigDecimal("129.99"));

        assertThatThrownBy(() -> service.create(request, "manager@example.com"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("exactly 130.00 BDT");
        verify(sales, never()).save(any());
    }

    @Test
    void acceptsAUserEnteredProductAndPrice() {
        var service = new SalesService(new ProductCatalog(), sales, cancellations, users, products);
        var operator = new AppUser("Manager", "manager@example.com", "hash", Role.MANAGER);
        when(users.findByEmailIgnoreCase("manager@example.com")).thenReturn(Optional.of(operator));
        when(sales.save(any(Sale.class))).thenAnswer(invocation -> invocation.getArgument(0));

        service.create(
                new CreateSaleRequest("Mango Shake", 2, new BigDecimal("175.50")),
                "manager@example.com"
        );

        ArgumentCaptor<Sale> captor = ArgumentCaptor.forClass(Sale.class);
        verify(sales).save(captor.capture());
        assertThat(captor.getValue().getItemName()).isEqualTo("Mango Shake");
        assertThat(captor.getValue().getUnitPrice()).isEqualByComparingTo("175.50");
        assertThat(captor.getValue().getTotal()).isEqualByComparingTo("351.00");
    }
}
