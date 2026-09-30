package com.financialplatform.repository;

import com.financialplatform.domain.AppUser;
import com.financialplatform.domain.InvestmentCycle;
import com.financialplatform.domain.InvestmentCycleStatus;
import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface InvestmentCycleRepository extends JpaRepository<InvestmentCycle, Long> {
  @Query("select c from InvestmentCycle c where c.transaction.investor = :investor order by c.startsAt desc")
  List<InvestmentCycle> findByInvestor(@Param("investor") AppUser investor);

  @Query("select c from InvestmentCycle c where c.transaction.investor.business = :business order by c.startsAt desc")
  List<InvestmentCycle> findByBusiness(@Param("business") com.financialplatform.domain.Business business);

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select c from InvestmentCycle c where c.id = :id and c.status = :status")
  Optional<InvestmentCycle> findByIdAndStatus(
      @Param("id") Long id, @Param("status") InvestmentCycleStatus status);

  boolean existsByTransactionAndStatus(
      com.financialplatform.domain.InvestmentTransaction transaction,
      InvestmentCycleStatus status);
}
