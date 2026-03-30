package com.example.skillforge.repository;

import com.example.skillforge.entity.AchievementBadge;
import com.example.skillforge.entity.AchievementBadgeCode;
import com.example.skillforge.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AchievementBadgeRepository extends JpaRepository<AchievementBadge, Long> {
    List<AchievementBadge> findByStudentOrderByAwardedAtDesc(User student);
    Optional<AchievementBadge> findByStudentAndBadgeCode(User student, AchievementBadgeCode badgeCode);
}
