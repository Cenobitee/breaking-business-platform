package com.financialplatform.api.dto;

import com.financialplatform.domain.Role;

public record AuthResponse(
        String accessToken,
        String tokenType,
        long expiresInSeconds,
        UserView user
) {
    public record UserView(Long id, String fullName, String email, Role role, Long businessId, String businessName) {}
}
