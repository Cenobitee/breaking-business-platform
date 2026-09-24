package com.financialplatform.service;

import com.financialplatform.api.dto.CreateBusinessUserRequest;
import com.financialplatform.api.dto.UserResponse;
import com.financialplatform.domain.AppUser;
import com.financialplatform.domain.Role;
import com.financialplatform.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class UserDirectoryService {
    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;

    public UserDirectoryService(UserRepository users, PasswordEncoder passwordEncoder) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public List<UserResponse> list(String requestingEmail) {
        AppUser requester = requireUser(requestingEmail);
        return users.findByBusinessOrderByFullName(requester.getBusiness()).stream()
                .map(user -> UserResponse.from(user, requester.getRole() == Role.OWNER))
                .toList();
    }

    @Transactional
    public UserResponse create(CreateBusinessUserRequest request, String ownerEmail) {
        if (request.role() != Role.MANAGER && request.role() != Role.INVESTOR) {
            throw new IllegalArgumentException("Owners can create only Manager or Investor profiles");
        }
        String email = request.email().trim().toLowerCase();
        if (users.findByEmailIgnoreCase(email).isPresent()) {
            throw new IllegalArgumentException("An account with this email already exists");
        }
        AppUser owner = requireUser(ownerEmail);
        AppUser created = users.save(new AppUser(
                request.fullName().trim(),
                email,
                passwordEncoder.encode(request.password()),
                request.role(),
                owner.getBusiness()
        ));
        return UserResponse.from(created);
    }

    private AppUser requireUser(String email) {
        return users.findByEmailIgnoreCase(email).orElseThrow();
    }
}
