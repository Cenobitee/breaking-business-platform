package com.financialplatform.api.dto;

import com.financialplatform.domain.AppUser;
import com.financialplatform.domain.Role;

public record UserResponse(Long id, String fullName, String email, Role role, boolean active, Long businessId, String businessName) {
    public static UserResponse from(AppUser user) {
        return from(user, true);
    }
    public static UserResponse from(AppUser user, boolean includeLoginEmail) {
        return new UserResponse(user.getId(), user.getFullName(), includeLoginEmail ? user.getEmail() : null, user.getRole(), user.isActive(),
                user.getBusiness().getId(), user.getBusiness().getName());
    }
}
