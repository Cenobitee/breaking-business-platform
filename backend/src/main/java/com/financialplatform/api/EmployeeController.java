package com.financialplatform.api;

import com.financialplatform.api.dto.EmployeeRequest;
import com.financialplatform.api.dto.EmployeeResponse;
import com.financialplatform.service.EmployeeService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/employees")
public class EmployeeController {
    private final EmployeeService employees;
    public EmployeeController(EmployeeService employees) { this.employees = employees; }

    @GetMapping public List<EmployeeResponse> list(Authentication auth) { return employees.list(auth.getName()); }
    @PostMapping @ResponseStatus(HttpStatus.CREATED)
    public EmployeeResponse create(@Valid @RequestBody EmployeeRequest request, Authentication auth) { return employees.create(request, auth.getName()); }
    @PutMapping("/{id}")
    public EmployeeResponse update(@PathVariable long id, @Valid @RequestBody EmployeeRequest request, Authentication auth) { return employees.update(id, request, auth.getName()); }
    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable long id, Authentication auth) { employees.delete(id, auth.getName()); }
}
