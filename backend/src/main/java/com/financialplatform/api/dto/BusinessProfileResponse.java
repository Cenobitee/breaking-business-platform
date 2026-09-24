package com.financialplatform.api.dto;

import com.financialplatform.domain.Business;

import java.time.Instant;

public record BusinessProfileResponse(
        Long id,
        String name,
        String description,
        String address,
        String phone,
        String contactEmail,
        String website,
        String logoDataUrl,
        Instant createdAt
) {
    public static BusinessProfileResponse from(Business business) {
        return new BusinessProfileResponse(
                business.getId(), business.getName(), business.getDescription(), business.getAddress(),
                business.getPhone(), business.getContactEmail(), business.getWebsite(),
                business.getLogoDataUrl(), business.getCreatedAt()
        );
    }
}
