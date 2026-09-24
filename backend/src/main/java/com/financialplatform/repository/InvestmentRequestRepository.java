package com.financialplatform.repository;

import com.financialplatform.domain.AppUser;
import com.financialplatform.domain.InvestmentRequest;
import com.financialplatform.domain.InvestmentRequestStatus;
import com.financialplatform.domain.Business;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface InvestmentRequestRepository extends JpaRepository<InvestmentRequest, Long> {
    List<InvestmentRequest> findByInvestorOrderByRequestedAtDesc(AppUser investor);
    List<InvestmentRequest> findByStatusOrderByRequestedAtAsc(InvestmentRequestStatus status);
    List<InvestmentRequest> findByStatusAndInvestorBusinessOrderByRequestedAtAsc(InvestmentRequestStatus status, Business business);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from InvestmentRequest r where r.id = :id")
    Optional<InvestmentRequest> findForUpdateById(@Param("id") long id);
}
