package com.example.skillforge.repository;

import com.example.skillforge.entity.StudentProfile;
import com.example.skillforge.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface StudentProfileRepository extends JpaRepository<StudentProfile, Long> {
    Optional<StudentProfile> findByUser(User user);
}
