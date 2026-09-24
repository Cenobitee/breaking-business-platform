package com.financialplatform.service;

import com.financialplatform.domain.AppUser;
import com.financialplatform.domain.Business;
import com.financialplatform.domain.ChatMessage;
import com.financialplatform.domain.Role;
import com.financialplatform.repository.ChatMessageRepository;
import com.financialplatform.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MessagingServiceTest {
    @Mock UserRepository users;
    @Mock ChatMessageRepository messages;

    @Test
    void senderCanEditTheirOwnMessage() {
        Business business = new Business("Business");
        AppUser owner = new AppUser("Owner", "owner@example.com", "hash", Role.OWNER, business);
        AppUser manager = new AppUser("Manager", "manager@example.com", "hash", Role.MANAGER, business);
        ChatMessage message = new ChatMessage(owner, manager, "Original");
        when(users.findByEmailIgnoreCase("owner@example.com")).thenReturn(Optional.of(owner));
        when(messages.findForUpdateById(4L)).thenReturn(Optional.of(message));

        var service = new MessagingService(users, messages, new MessagingPolicy());
        var response = service.edit(4L, "Updated message", "owner@example.com");

        assertThat(response.body()).isEqualTo("Updated message");
        assertThat(response.editedAt()).isNotNull();
    }

    @Test
    void userCannotDeleteAnotherPersonsMessage() {
        Business business = new Business("Business");
        AppUser investor = new AppUser("Investor", "investor@example.com", "hash", Role.INVESTOR, business);
        AppUser owner = new AppUser("Owner", "owner@example.com", "hash", Role.OWNER, business);
        ChatMessage message = new ChatMessage(owner, investor, "Owner message");
        when(users.findByEmailIgnoreCase("investor@example.com")).thenReturn(Optional.of(investor));
        when(messages.findForUpdateById(7L)).thenReturn(Optional.of(message));

        var service = new MessagingService(users, messages, new MessagingPolicy());

        assertThatThrownBy(() -> service.delete(7L, "investor@example.com"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("only your own messages");
        verify(messages, never()).delete(message);
    }
}
