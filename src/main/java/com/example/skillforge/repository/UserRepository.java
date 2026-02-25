package com.example.skillforge.repository;

import com.example.skillforge.entity.User;
import com.example.skillforge.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    public boolean existsByEmail(String email);
    public Optional<User> findByEmail(String email);
    long countByRole(Role role);
    long countByIsActive(Boolean isActive);
    long countByCreatedAtAfter(LocalDateTime dateTime);
}
