package com.financialplatform.api.dto;

import com.financialplatform.domain.Employee;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record EmployeeResponse(Long id, String name, String position, String address, String nid,
                               String phone, String shift, BigDecimal salary, LocalDate joiningDate,
                               Instant createdAt) {
    public static EmployeeResponse from(Employee employee) {
        return new EmployeeResponse(employee.getId(), employee.getName(), employee.getPosition(),
                employee.getAddress(), employee.getNid(), employee.getPhone(), employee.getShift(),
                employee.getSalary(), employee.getJoiningDate(), employee.getCreatedAt());
    }
}
