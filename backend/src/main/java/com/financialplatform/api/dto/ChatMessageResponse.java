package com.financialplatform.api.dto;

import com.financialplatform.domain.ChatMessage;

import java.time.Instant;

public record ChatMessageResponse(
        Long id,
        Long senderId,
        String senderName,
        Long recipientId,
        String body,
        Instant sentAt,
        Instant readAt,
        Instant editedAt
) {
    public static ChatMessageResponse from(ChatMessage message) {
        return new ChatMessageResponse(
                message.getId(), message.getSender().getId(), message.getSender().getFullName(),
                message.getRecipient().getId(), message.getBody(), message.getSentAt(), message.getReadAt(),
                message.getEditedAt()
        );
    }
}
