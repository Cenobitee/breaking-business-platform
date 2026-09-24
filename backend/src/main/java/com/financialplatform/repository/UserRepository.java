package com.financialplatform.repository;

import com.financialplatform.domain.AppUser;
import com.financialplatform.domain.Business;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.List;

public interface UserRepository extends JpaRepository<AppUser, Long> {
    Optional<AppUser> findByEmailIgnoreCase(String email);
    List<AppUser> findByBusinessOrderByFullName(Business business);
}
