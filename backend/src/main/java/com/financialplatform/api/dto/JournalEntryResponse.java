package com.financialplatform.api.dto;
import java.math.BigDecimal;
import java.time.Instant;
public record JournalEntryResponse(Instant occurredAt, String source, String description, String debitAccount, BigDecimal debit, String creditAccount, BigDecimal credit, String plainExplanation) {}
