package com.financialplatform.api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateBusinessProfileRequest(
        @NotBlank @Size(max = 160) String name,
        @Size(max = 1000) String description,
        @Size(max = 240) String address,
        @Size(max = 40) String phone,
        @Email @Size(max = 254) String contactEmail,
        @Size(max = 300) String website,
        @Size(max = 1_000_000) String logoDataUrl
) {}
