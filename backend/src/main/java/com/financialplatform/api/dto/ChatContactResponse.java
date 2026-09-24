package com.financialplatform.api.dto;

import com.financialplatform.domain.AppUser;
import com.financialplatform.domain.Role;

public record ChatContactResponse(
        Long id,
        String fullName,
        Role role,
        String personalEmail,
        boolean canSend,
        long unreadCount
) {
    public static ChatContactResponse from(AppUser user, String personalEmail, boolean canSend, long unreadCount) {
        return new ChatContactResponse(user.getId(), user.getFullName(), user.getRole(), personalEmail, canSend, unreadCount);
    }
}
