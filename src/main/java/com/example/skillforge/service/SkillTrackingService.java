package com.example.skillforge.service;

import com.example.skillforge.dto.UserSkillLevelResponse;
import com.example.skillforge.entity.Skill;
import com.example.skillforge.entity.User;
import com.example.skillforge.entity.UserSkillLevel;
import com.example.skillforge.repository.SkillRepository;
import com.example.skillforge.repository.UserSkillLevelRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SkillTrackingService {

    private final SkillRepository skillRepository;
    private final UserSkillLevelRepository userSkillLevelRepository;

    /**
     * Updates rolling mastery scores for each concept touched in a quiz attempt.
     */
    @Transactional
    public void updateSkillScores(User user, Map<String, Double> conceptAccuracy) {
        for (Map.Entry<String, Double> entry : conceptAccuracy.entrySet()) {
            Skill skill = skillRepository.findByName(entry.getKey())
                    .orElseGet(() -> skillRepository.save(Skill.builder()
                            .name(entry.getKey())
                            .description("Concept skill generated from quiz concept tags")
                            .build()));

            UserSkillLevel level = userSkillLevelRepository.findByUserAndSkill(user, skill)
                    .orElse(UserSkillLevel.builder()
                            .user(user)
                            .skill(skill)
                            .score(0.0)
                            .mastered(false)
                            .build());

            double updatedScore = level.getScore() == 0.0
                    ? entry.getValue()
                    : (level.getScore() + entry.getValue()) / 2.0;

            level.setScore(updatedScore);
            level.setMastered(updatedScore >= 80.0);
            userSkillLevelRepository.save(level);
        }
    }

    /**
     * Returns the tracked skill levels for the authenticated learner.
     */
    public List<UserSkillLevelResponse> getUserSkills(User user) {
        return userSkillLevelRepository.findByUser(user).stream()
                .map(level -> UserSkillLevelResponse.builder()
                        .skill(level.getSkill().getName())
                        .score(level.getScore())
                        .mastered(level.isMastered())
                        .build())
                .toList();
    }
}
