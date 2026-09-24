package com.financialplatform.repository;

import com.financialplatform.domain.AppUser;
import com.financialplatform.domain.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import jakarta.persistence.LockModeType;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    @Query("""
            select m from ChatMessage m
            where (m.sender = :first and m.recipient = :second)
               or (m.sender = :second and m.recipient = :first)
            order by m.sentAt asc
            """)
    List<ChatMessage> conversation(@Param("first") AppUser first, @Param("second") AppUser second);

    long countByRecipientAndSenderAndReadAtIsNull(AppUser recipient, AppUser sender);
    long countByRecipientAndReadAtIsNull(AppUser recipient);

    @Modifying
    @Query("update ChatMessage m set m.readAt = :readAt where m.recipient = :recipient and m.sender = :sender and m.readAt is null")
    int markRead(@Param("recipient") AppUser recipient, @Param("sender") AppUser sender, @Param("readAt") Instant readAt);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select m from ChatMessage m where m.id = :id")
    Optional<ChatMessage> findForUpdateById(@Param("id") long id);
}
