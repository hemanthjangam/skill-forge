package com.example.skillforge.repository;

import com.example.skillforge.entity.Skill;
import com.example.skillforge.entity.User;
import com.example.skillforge.entity.UserSkillLevel;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserSkillLevelRepository extends JpaRepository<UserSkillLevel, Long> {
    Optional<UserSkillLevel> findByUserAndSkill(User user, Skill skill);
    List<UserSkillLevel> findByUser(User user);
}
