package com.financialplatform.api.dto;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDate;

public record EmployeeRequest(
        @NotBlank @Size(max = 120) String name,
        @NotBlank @Size(max = 120) String position,
        @NotBlank @Size(max = 300) String address,
        @NotBlank @Size(max = 40) String nid,
        @NotBlank @Size(max = 40) String phone,
        @NotBlank @Size(max = 80) String shift,
        @NotNull @DecimalMin("0.00") @Digits(integer = 12, fraction = 2) BigDecimal salary,
        @NotNull @PastOrPresent LocalDate joiningDate
) {}
