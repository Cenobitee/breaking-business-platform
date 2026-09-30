package com.financialplatform.repository;

import com.financialplatform.domain.Business;
import com.financialplatform.domain.Sale;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SaleRepository extends JpaRepository<Sale, Long> {
  @Query(
      """
      select s from Sale s
      where s.createdBy.business = :business
      and not exists (select c.id from SaleCancellation c where c.sale = s)
      order by s.createdAt desc
      """)
  List<Sale> findRecentActive(@Param("business") Business business, Pageable pageable);

  @Query(
      "select s from Sale s where s.createdBy.business = :business and not exists (select c.id from"
          + " SaleCancellation c where c.sale = s) order by s.createdAt desc")
  List<Sale> findAllActive(@Param("business") Business business);

  @Query(
      """
      select s from Sale s
      where s.createdBy.business = :business
      and s.createdAt >= :start and s.createdAt < :end
      and not exists (select c.id from SaleCancellation c where c.sale = s)
      order by s.createdAt desc
      """)
  List<Sale> findActiveBetween(
      @Param("business") Business business,
      @Param("start") Instant start,
      @Param("end") Instant end);

  @Query(
      """
      select count(s) from Sale s
      where s.createdBy.business = :business
      and s.createdAt >= :start and s.createdAt < :end
      and not exists (select c.id from SaleCancellation c where c.sale = s)
      """)
  long countActiveBetween(
      @Param("business") Business business,
      @Param("start") Instant start,
      @Param("end") Instant end);

  @Query(
      """
      select coalesce(sum(s.total), 0) from Sale s
      where s.createdBy.business = :business
      and s.createdAt >= :start and s.createdAt < :end
      and not exists (select c.id from SaleCancellation c where c.sale = s)
      """)
  BigDecimal sumTotalBetween(
      @Param("business") Business business,
      @Param("start") Instant start,
      @Param("end") Instant end);

  @Query(
      """
      select coalesce(sum(s.quantity * s.unitCostSnapshot), 0) from Sale s
      where s.createdBy.business = :business
      and s.createdAt >= :start and s.createdAt < :end
      and not exists (select c.id from SaleCancellation c where c.sale = s)
      """)
  BigDecimal sumDirectCostBetween(
      @Param("business") Business business,
      @Param("start") Instant start,
      @Param("end") Instant end);

  @Query(
      """
      select coalesce(sum(s.total), 0) from Sale s
      where s.createdBy.business = :business
      and not exists (select c.id from SaleCancellation c where c.sale = s)
      """)
  BigDecimal sumAllRevenue(@Param("business") Business business);

  @Query(
      """
      select coalesce(sum(s.total), 0) from Sale s
      where s.createdBy.business = :business
      and s.product.id in :productIds
      and s.createdAt >= :start and s.createdAt < :end
      and not exists (select c.id from SaleCancellation c where c.sale = s)
      """)
  BigDecimal sumTotalBetweenForProducts(
      @Param("business") Business business,
      @Param("productIds") List<Long> productIds,
      @Param("start") Instant start,
      @Param("end") Instant end);

  @Query(
      """
      select coalesce(sum(s.quantity * s.unitCostSnapshot), 0) from Sale s
      where s.createdBy.business = :business
      and s.product.id in :productIds
      and s.createdAt >= :start and s.createdAt < :end
      and not exists (select c.id from SaleCancellation c where c.sale = s)
      """)
  BigDecimal sumDirectCostBetweenForProducts(
      @Param("business") Business business,
      @Param("productIds") List<Long> productIds,
      @Param("start") Instant start,
      @Param("end") Instant end);
}
