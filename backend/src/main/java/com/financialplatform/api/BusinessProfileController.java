package com.financialplatform.api;

import com.financialplatform.api.dto.BusinessProfileResponse;
import com.financialplatform.api.dto.UpdateBusinessProfileRequest;
import com.financialplatform.service.BusinessProfileService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/business")
public class BusinessProfileController {
    private final BusinessProfileService profiles;

    public BusinessProfileController(BusinessProfileService profiles) {
        this.profiles = profiles;
    }

    @GetMapping
    public BusinessProfileResponse get(Authentication authentication) {
        return profiles.get(authentication.getName());
    }

    @PutMapping
    public BusinessProfileResponse update(
            @Valid @RequestBody UpdateBusinessProfileRequest request,
            Authentication authentication
    ) {
        return profiles.update(request, authentication.getName());
    }
}
