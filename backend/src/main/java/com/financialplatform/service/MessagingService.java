package com.financialplatform.service;

import com.financialplatform.api.dto.ChatContactResponse;
import com.financialplatform.api.dto.ChatMessageResponse;
import com.financialplatform.domain.AppUser;
import com.financialplatform.domain.ChatMessage;
import com.financialplatform.repository.ChatMessageRepository;
import com.financialplatform.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
public class MessagingService {
    private final UserRepository users;
    private final ChatMessageRepository messages;
    private final MessagingPolicy policy;

    public MessagingService(UserRepository users, ChatMessageRepository messages, MessagingPolicy policy) {
        this.users = users;
        this.messages = messages;
        this.policy = policy;
    }

    @Transactional(readOnly = true)
    public List<ChatContactResponse> contacts(String userEmail) {
        AppUser current = requireUser(userEmail);
        return users.findByBusinessOrderByFullName(current.getBusiness()).stream()
                .filter(contact -> !contact.getId().equals(current.getId()))
                .filter(contact -> policy.canView(current.getRole(), contact.getRole()))
                .map(contact -> ChatContactResponse.from(
                        contact,
                        current.getRole() == com.financialplatform.domain.Role.OWNER || current.getRole() == com.financialplatform.domain.Role.INVESTOR ? contact.getContactEmail() : null,
                        policy.canSend(current.getRole(), contact.getRole()),
                        messages.countByRecipientAndSenderAndReadAtIsNull(current, contact)
                ))
                .toList();
    }

    @Transactional
    public List<ChatMessageResponse> conversation(long contactId, String userEmail) {
        AppUser current = requireUser(userEmail);
        AppUser contact = requireContact(contactId, current);
        messages.markRead(current, contact, Instant.now());
        return messages.conversation(current, contact).stream()
                .map(ChatMessageResponse::from)
                .toList();
    }

    @Transactional
    public ChatMessageResponse send(long contactId, String body, String userEmail) {
        AppUser sender = requireUser(userEmail);
        AppUser recipient = requireContact(contactId, sender);
        if (!policy.canSend(sender.getRole(), recipient.getRole())) {
            throw new IllegalArgumentException("Your role cannot send messages to this contact");
        }
        return ChatMessageResponse.from(messages.save(new ChatMessage(sender, recipient, body.trim())));
    }

    @Transactional
    public ChatMessageResponse edit(long messageId, String body, String userEmail) {
        AppUser current = requireUser(userEmail);
        ChatMessage message = requireOwnedMessage(messageId, current);
        message.edit(body.trim(), Instant.now());
        return ChatMessageResponse.from(message);
    }

    @Transactional
    public void delete(long messageId, String userEmail) {
        AppUser current = requireUser(userEmail);
        messages.delete(requireOwnedMessage(messageId, current));
    }

    @Transactional(readOnly = true)
    public long unreadCount(String userEmail) {
        return messages.countByRecipientAndReadAtIsNull(requireUser(userEmail));
    }

    private AppUser requireUser(String email) {
        return users.findByEmailIgnoreCase(email).orElseThrow();
    }

    private AppUser requireContact(long contactId, AppUser current) {
        AppUser contact = users.findById(contactId)
                .orElseThrow(() -> new IllegalArgumentException("Contact not found"));
        if (current.getBusiness() == null || contact.getBusiness() == null
                || !current.getBusiness().getId().equals(contact.getBusiness().getId())
                || !policy.canView(current.getRole(), contact.getRole())) {
            throw new IllegalArgumentException("Contact not found");
        }
        return contact;
    }

    private ChatMessage requireOwnedMessage(long messageId, AppUser current) {
        ChatMessage message = messages.findForUpdateById(messageId)
                .orElseThrow(() -> new IllegalArgumentException("Message not found"));
        if (message.getSender() != current
                && (message.getSender().getId() == null || !message.getSender().getId().equals(current.getId()))) {
            throw new IllegalArgumentException("You can edit or delete only your own messages");
        }
        return message;
    }
}
