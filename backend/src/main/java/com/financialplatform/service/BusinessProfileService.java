package com.financialplatform.service;

import com.financialplatform.api.dto.BusinessProfileResponse;
import com.financialplatform.api.dto.UpdateBusinessProfileRequest;
import com.financialplatform.domain.AppUser;
import com.financialplatform.domain.Business;
import com.financialplatform.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BusinessProfileService {
    private final UserRepository users;

    public BusinessProfileService(UserRepository users) {
        this.users = users;
    }

    @Transactional(readOnly = true)
    public BusinessProfileResponse get(String userEmail) {
        return BusinessProfileResponse.from(requireUser(userEmail).getBusiness());
    }

    @Transactional
    public BusinessProfileResponse update(UpdateBusinessProfileRequest request, String ownerEmail) {
        Business business = requireUser(ownerEmail).getBusiness();
        String logo = normalize(request.logoDataUrl());
        if (logo != null && !logo.matches("^data:image/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$")) {
            throw new IllegalArgumentException("The logo must be a PNG, JPEG, WebP, or GIF image");
        }
        business.updateProfile(
                request.name().trim(),
                normalize(request.description()),
                normalize(request.address()),
                normalize(request.phone()),
                normalize(request.contactEmail()),
                normalize(request.website()),
                logo
        );
        return BusinessProfileResponse.from(business);
    }

    private AppUser requireUser(String email) {
        return users.findByEmailIgnoreCase(email).orElseThrow();
    }

    private String normalize(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
