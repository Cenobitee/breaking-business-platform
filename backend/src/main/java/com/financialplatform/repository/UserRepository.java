package com.financialplatform.repository;

import com.financialplatform.domain.AppUser;
import com.financialplatform.domain.Business;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<AppUser, Long> {
  Optional<AppUser> findByEmailIgnoreCase(String email);

  List<AppUser> findByBusinessOrderByFullName(Business business);
}
