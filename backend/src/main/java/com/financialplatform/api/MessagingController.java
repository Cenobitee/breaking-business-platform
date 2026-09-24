package com.financialplatform.api;

import com.financialplatform.api.dto.ChatContactResponse;
import com.financialplatform.api.dto.ChatMessageResponse;
import com.financialplatform.api.dto.EditChatMessageRequest;
import com.financialplatform.api.dto.SendChatMessageRequest;
import com.financialplatform.service.MessagingService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/messages")
public class MessagingController {
    private final MessagingService messaging;

    public MessagingController(MessagingService messaging) {
        this.messaging = messaging;
    }

    @GetMapping("/contacts")
    public List<ChatContactResponse> contacts(Authentication authentication) {
        return messaging.contacts(authentication.getName());
    }

    @GetMapping("/unread-count")
    public Map<String, Long> unreadCount(Authentication authentication) {
        return Map.of("unreadCount", messaging.unreadCount(authentication.getName()));
    }

    @GetMapping("/conversations/{contactId}")
    public List<ChatMessageResponse> conversation(
            @PathVariable("contactId") long contactId,
            Authentication authentication
    ) {
        return messaging.conversation(contactId, authentication.getName());
    }

    @PostMapping("/conversations/{contactId}")
    public ResponseEntity<ChatMessageResponse> send(
            @PathVariable("contactId") long contactId,
            @Valid @RequestBody SendChatMessageRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(messaging.send(contactId, request.body(), authentication.getName()));
    }

    @PatchMapping("/{messageId}")
    public ChatMessageResponse edit(
            @PathVariable("messageId") long messageId,
            @Valid @RequestBody EditChatMessageRequest request,
            Authentication authentication
    ) {
        return messaging.edit(messageId, request.body(), authentication.getName());
    }

    @DeleteMapping("/{messageId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @PathVariable("messageId") long messageId,
            Authentication authentication
    ) {
        messaging.delete(messageId, authentication.getName());
    }
}
