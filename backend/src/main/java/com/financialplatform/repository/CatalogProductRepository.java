package com.financialplatform.repository;

import com.financialplatform.domain.Business;
import com.financialplatform.domain.CatalogProduct;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface CatalogProductRepository extends JpaRepository<CatalogProduct, Long> {
    List<CatalogProduct> findByBusinessOrderByName(Business business);
    boolean existsByBusinessAndNameIgnoreCase(Business business, String name);
    boolean existsByBusinessAndNameIgnoreCaseAndIdNot(Business business, String name, Long id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select product from CatalogProduct product where product.id = :id")
    Optional<CatalogProduct> findForSaleById(@Param("id") Long id);
}
