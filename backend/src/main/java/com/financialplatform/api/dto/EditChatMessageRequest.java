package com.financialplatform.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record EditChatMessageRequest(@NotBlank @Size(max = 2000) String body) {}
