package com.example.skillforge.repository;

import com.example.skillforge.entity.TrainerProfile;
import com.example.skillforge.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TrainerProfileRepository extends JpaRepository<TrainerProfile, Long> {
    Optional<TrainerProfile> findByUser(User user);
    long countByApproved(boolean approved);
}
