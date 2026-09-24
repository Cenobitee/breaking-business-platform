package com.financialplatform.service;

import com.financialplatform.api.dto.EmployeeRequest;
import com.financialplatform.api.dto.EmployeeResponse;
import com.financialplatform.domain.AppUser;
import com.financialplatform.domain.Employee;
import com.financialplatform.repository.EmployeeRepository;
import com.financialplatform.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class EmployeeService {
    private final EmployeeRepository employees;
    private final UserRepository users;

    public EmployeeService(EmployeeRepository employees, UserRepository users) {
        this.employees = employees; this.users = users;
    }

    @Transactional(readOnly = true)
    public List<EmployeeResponse> list(String email) {
        AppUser current = requireUser(email);
        return employees.findByBusinessOrderByName(current.getBusiness()).stream().map(EmployeeResponse::from).toList();
    }

    @Transactional
    public EmployeeResponse create(EmployeeRequest request, String email) {
        AppUser current = requireUser(email);
        if (employees.existsByBusinessAndNidIgnoreCase(current.getBusiness(), request.nid().trim())) {
            throw new IllegalArgumentException("An employee with this NID already exists");
        }
        return EmployeeResponse.from(employees.save(new Employee(current.getBusiness(), request.name(),
                request.position(), request.address(), request.nid(), request.phone(), request.shift(),
                request.salary(), request.joiningDate())));
    }

    @Transactional
    public EmployeeResponse update(long id, EmployeeRequest request, String email) {
        AppUser current = requireUser(email);
        Employee employee = requireEmployee(id, current);
        if (employees.existsByBusinessAndNidIgnoreCaseAndIdNot(current.getBusiness(), request.nid().trim(), id)) {
            throw new IllegalArgumentException("An employee with this NID already exists");
        }
        employee.update(request.name(), request.position(), request.address(), request.nid(), request.phone(),
                request.shift(), request.salary(), request.joiningDate());
        return EmployeeResponse.from(employee);
    }

    @Transactional
    public void delete(long id, String email) {
        AppUser current = requireUser(email);
        employees.delete(requireEmployee(id, current));
    }

    private AppUser requireUser(String email) { return users.findByEmailIgnoreCase(email).orElseThrow(); }
    private Employee requireEmployee(long id, AppUser current) {
        Employee employee = employees.findById(id).orElseThrow(() -> new IllegalArgumentException("Employee not found"));
        if (!employee.getBusiness().getId().equals(current.getBusiness().getId())) {
            throw new IllegalArgumentException("Employee not found");
        }
        return employee;
    }
}
