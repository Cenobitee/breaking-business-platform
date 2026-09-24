package com.financialplatform.domain;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "chat_messages")
public class ChatMessage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "business_id", nullable = false, updatable = false)
    private Business business;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sender_id", nullable = false, updatable = false)
    private AppUser sender;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "recipient_id", nullable = false, updatable = false)
    private AppUser recipient;

    @Column(nullable = false, length = 2000)
    private String body;

    @Column(name = "sent_at", nullable = false, updatable = false)
    private Instant sentAt = Instant.now();

    @Column(name = "read_at")
    private Instant readAt;

    @Column(name = "edited_at")
    private Instant editedAt;

    protected ChatMessage() {}

    public ChatMessage(AppUser sender, AppUser recipient, String body) {
        this.business = sender.getBusiness();
        this.sender = sender;
        this.recipient = recipient;
        this.body = body;
    }

    public Long getId() { return id; }
    public AppUser getSender() { return sender; }
    public AppUser getRecipient() { return recipient; }
    public String getBody() { return body; }
    public Instant getSentAt() { return sentAt; }
    public Instant getReadAt() { return readAt; }
    public Instant getEditedAt() { return editedAt; }

    public void edit(String body, Instant editedAt) {
        this.body = body;
        this.editedAt = editedAt;
    }
}
