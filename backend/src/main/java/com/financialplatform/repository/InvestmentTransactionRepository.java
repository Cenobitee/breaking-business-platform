package com.financialplatform.repository;

import com.financialplatform.domain.AppUser;
import com.financialplatform.domain.InvestmentTransaction;
import com.financialplatform.domain.Business;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;

import java.math.BigDecimal;
import java.util.List;

public interface InvestmentTransactionRepository extends JpaRepository<InvestmentTransaction, Long> {
    List<InvestmentTransaction> findByInvestorOrderByInvestedAtDesc(AppUser investor);

    @Query("select coalesce(sum(t.amount), 0) from InvestmentTransaction t where t.investor.business = :business and not exists (select r.id from InvestmentRemoval r where r.transaction = t)")
    BigDecimal sumAllInvestments(@Param("business") Business business);

    @Query("select coalesce(sum(t.amount), 0) from InvestmentTransaction t where t.investor = :investor and not exists (select r.id from InvestmentRemoval r where r.transaction = t)")
    BigDecimal sumByInvestor(@Param("investor") AppUser investor);

    @Query("select t from InvestmentTransaction t where t.investor.business = :business and not exists (select r.id from InvestmentRemoval r where r.transaction = t) order by t.investedAt desc")
    List<InvestmentTransaction> findActiveInvestments(@Param("business") Business business);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select t from InvestmentTransaction t where t.id = :id")
    java.util.Optional<InvestmentTransaction> findForUpdateById(@Param("id") long id);
}
