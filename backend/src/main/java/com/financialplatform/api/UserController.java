package com.financialplatform.api;

import com.financialplatform.api.dto.CreateBusinessUserRequest;
import com.financialplatform.api.dto.UserResponse;
import com.financialplatform.service.UserDirectoryService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {
    private final UserDirectoryService directory;

    public UserController(UserDirectoryService directory) {
        this.directory = directory;
    }

    @GetMapping
    public List<UserResponse> list(Authentication authentication) {
        return directory.list(authentication.getName());
    }

    @PostMapping
    public ResponseEntity<UserResponse> create(
            @Valid @RequestBody CreateBusinessUserRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(directory.create(request, authentication.getName()));
    }
}
