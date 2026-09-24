package com.financialplatform.repository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Repository;

@Repository
public class InvestmentHistoryPurgeRepository {
    @PersistenceContext
    private EntityManager entityManager;

    public int purgeForBusiness(long businessId) {
        entityManager.createNativeQuery("select set_config('app.allow_investment_purge', 'true', true)")
                .getSingleResult();
        int removals = entityManager.createNativeQuery("""
                        delete from investment_removals
                        where investor_id in (select id from users where business_id = :businessId)
                        """)
                .setParameter("businessId", businessId)
                .executeUpdate();
        int transactions = entityManager.createNativeQuery("""
                        delete from investment_transactions
                        where investor_id in (select id from users where business_id = :businessId)
                        """)
                .setParameter("businessId", businessId)
                .executeUpdate();
        int requests = entityManager.createNativeQuery("""
                        delete from investment_requests
                        where investor_id in (select id from users where business_id = :businessId)
                        """)
                .setParameter("businessId", businessId)
                .executeUpdate();
        entityManager.clear();
        return removals + transactions + requests;
    }
}
