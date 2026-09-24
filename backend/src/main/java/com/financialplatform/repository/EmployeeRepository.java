package com.financialplatform.repository;

import com.financialplatform.domain.Business;
import com.financialplatform.domain.Employee;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EmployeeRepository extends JpaRepository<Employee, Long> {
    List<Employee> findByBusinessOrderByName(Business business);
    boolean existsByBusinessAndNidIgnoreCaseAndIdNot(Business business, String nid, Long id);
    boolean existsByBusinessAndNidIgnoreCase(Business business, String nid);
}
