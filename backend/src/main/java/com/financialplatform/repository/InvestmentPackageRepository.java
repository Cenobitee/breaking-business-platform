package com.financialplatform.repository;

import com.financialplatform.domain.Business;
import com.financialplatform.domain.InvestmentPackage;
import java.util.List;
import java.util.Optional;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface InvestmentPackageRepository extends JpaRepository<InvestmentPackage, Long> {
  List<InvestmentPackage> findByBusinessOrderByAmountAsc(Business business);
  List<InvestmentPackage> findByBusinessAndActiveTrueOrderByIdDesc(Business business);
  List<InvestmentPackage> findByBusinessOrderByIdDesc(Business business);
  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select p from InvestmentPackage p where p.id = :id")
  Optional<InvestmentPackage> findForUpdateById(@Param("id") long id);
}
