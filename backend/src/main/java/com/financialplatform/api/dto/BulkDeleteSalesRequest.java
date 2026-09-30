package com.financialplatform.api.dto;

import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record BulkDeleteSalesRequest(@NotEmpty List<Long> saleIds) {}
