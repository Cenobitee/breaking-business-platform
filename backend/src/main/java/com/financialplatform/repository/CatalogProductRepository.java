package com.financialplatform.repository;

import com.financialplatform.domain.Business;
import com.financialplatform.domain.CatalogProduct;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CatalogProductRepository extends JpaRepository<CatalogProduct, Long> {
    List<CatalogProduct> findByBusinessOrderByName(Business business);
    boolean existsByBusinessAndNameIgnoreCase(Business business, String name);
    boolean existsByBusinessAndNameIgnoreCaseAndIdNot(Business business, String name, Long id);
}
