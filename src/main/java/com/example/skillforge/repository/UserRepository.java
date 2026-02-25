package com.example.skillforge.repository;

import com.example.skillforge.entity.Role;
import com.example.skillforge.entity.User;
import com.example.skillforge.entity.UserStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    long countByRole(Role role);
    long countByStatus(UserStatus status);
}
