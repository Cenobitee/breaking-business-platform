package com.financialplatform.repository;

import com.financialplatform.domain.Business;
import com.financialplatform.domain.InvestmentPackage;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InvestmentPackageRepository extends JpaRepository<InvestmentPackage, Long> {
  List<InvestmentPackage> findByBusinessOrderByAmountAsc(Business business);
  Optional<InvestmentPackage> findByBusinessAndAmount(Business business, BigDecimal amount);
}
