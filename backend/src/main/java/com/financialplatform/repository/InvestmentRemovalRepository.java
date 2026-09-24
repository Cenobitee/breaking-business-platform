package com.financialplatform.repository;

import com.financialplatform.domain.InvestmentRemoval;
import com.financialplatform.domain.InvestmentTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface InvestmentRemovalRepository extends JpaRepository<InvestmentRemoval, Long> {
    Optional<InvestmentRemoval> findByTransaction(InvestmentTransaction transaction);
    List<InvestmentRemoval> findByTransactionIn(List<InvestmentTransaction> transactions);
    boolean existsByTransaction(InvestmentTransaction transaction);
}
