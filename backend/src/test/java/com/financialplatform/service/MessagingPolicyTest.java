package com.financialplatform.service;

import com.financialplatform.domain.Role;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class MessagingPolicyTest {
    private final MessagingPolicy policy = new MessagingPolicy();

    @Test
    void investorCanMessageOwnerAndManager() {
        assertThat(policy.canSend(Role.INVESTOR, Role.OWNER)).isTrue();
        assertThat(policy.canSend(Role.INVESTOR, Role.MANAGER)).isTrue();
    }

    @Test
    void managerCannotMessageInvestor() {
        assertThat(policy.canSend(Role.MANAGER, Role.INVESTOR)).isFalse();
        assertThat(policy.canView(Role.MANAGER, Role.INVESTOR)).isTrue();
    }

    @Test
    void ownerCanMessageManagerAndInvestor() {
        assertThat(policy.canSend(Role.OWNER, Role.MANAGER)).isTrue();
        assertThat(policy.canSend(Role.OWNER, Role.INVESTOR)).isTrue();
    }
}
