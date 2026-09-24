package com.financialplatform.service;

import com.financialplatform.domain.Role;
import org.springframework.stereotype.Component;

@Component
public class MessagingPolicy {
    public boolean canSend(Role sender, Role recipient) {
        return switch (sender) {
            case OWNER -> recipient == Role.MANAGER || recipient == Role.INVESTOR;
            case INVESTOR -> recipient == Role.OWNER || recipient == Role.MANAGER;
            case MANAGER -> recipient == Role.OWNER;
        };
    }

    public boolean canView(Role viewer, Role contact) {
        return canSend(viewer, contact) || canSend(contact, viewer);
    }
}
