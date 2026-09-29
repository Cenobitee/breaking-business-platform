package com.financialplatform.repository;

import com.financialplatform.domain.AppUser;
import com.financialplatform.domain.PasswordResetToken;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
  Optional<PasswordResetToken> findByTokenHashAndUsedAtIsNull(String tokenHash);

  void deleteByUser(AppUser user);
}
