package com.financialplatform.config;

import com.financialplatform.domain.AppUser;
import com.financialplatform.domain.Business;
import com.financialplatform.domain.Role;
import com.financialplatform.repository.UserRepository;
import com.financialplatform.repository.BusinessRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class SeedDataConfig implements ApplicationRunner {
    private final UserRepository users;
    private final BusinessRepository businesses;
    private final PasswordEncoder passwordEncoder;
    private final boolean enabled;
    private final String defaultPassword;

    public SeedDataConfig(
            UserRepository users,
            BusinessRepository businesses,
            PasswordEncoder passwordEncoder,
            @Value("${app.seed.enabled}") boolean enabled,
            @Value("${app.seed.default-password}") String defaultPassword
    ) {
        this.users = users;
        this.businesses = businesses;
        this.passwordEncoder = passwordEncoder;
        this.enabled = enabled;
        this.defaultPassword = defaultPassword;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (!enabled || users.count() > 0) return;
        String passwordHash = passwordEncoder.encode(defaultPassword);
        Business business = businesses.save(new Business("Irodori"));
        users.save(new AppUser("Business Owner", "owner@example.com", passwordHash, Role.OWNER, business));
        users.save(new AppUser("Operations Manager", "manager@example.com", passwordHash, Role.MANAGER, business));
        users.save(new AppUser("Primary Investor", "investor@example.com", passwordHash, Role.INVESTOR, business));
    }
}
