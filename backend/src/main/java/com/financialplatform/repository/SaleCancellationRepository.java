package com.financialplatform.repository;

import com.financialplatform.domain.Sale;
import com.financialplatform.domain.SaleCancellation;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SaleCancellationRepository extends JpaRepository<SaleCancellation, Long> {
    boolean existsBySale(Sale sale);
}
