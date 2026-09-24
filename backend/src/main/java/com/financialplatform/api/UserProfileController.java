package com.financialplatform.api;

import com.financialplatform.api.dto.*;
import com.financialplatform.service.UserProfileService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profile")
public class UserProfileController {
    private final UserProfileService profiles;
    public UserProfileController(UserProfileService profiles) { this.profiles = profiles; }

    @GetMapping("/me") public UserProfileResponse me(Authentication auth) { return profiles.me(auth.getName()); }
    @PutMapping("/me") public UserProfileResponse updateMe(@Valid @RequestBody UpdateOwnProfileRequest request, Authentication auth) { return profiles.updateMe(request, auth.getName()); }
    @GetMapping("/members/{id}") public UserProfileResponse member(@PathVariable long id, Authentication auth) { return profiles.member(id, auth.getName()); }
    @PutMapping("/members/{id}") public UserProfileResponse updateMember(@PathVariable long id, @Valid @RequestBody OwnerUpdateMemberProfileRequest request, Authentication auth) { return profiles.updateMember(id, request, auth.getName()); }
}
