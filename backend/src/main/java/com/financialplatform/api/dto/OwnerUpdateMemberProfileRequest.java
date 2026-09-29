package com.financialplatform.api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record OwnerUpdateMemberProfileRequest(
    @NotBlank @Size(max = 120) String fullName,
    @Size(max = 40) String phone,
    @NotBlank @Email @Size(max = 254) String loginEmail) {}
