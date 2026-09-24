package com.financialplatform.repository;

import com.financialplatform.domain.InvestorPosition;
import com.financialplatform.domain.Business;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;

public interface InvestorPositionRepository extends JpaRepository<InvestorPosition, Long> {
    @Query("select coalesce(sum(i.initialCapital), 0) from InvestorPosition i where i.user.business = :business")
    BigDecimal sumInitialCapital(@Param("business") Business business);
}
