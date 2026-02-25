package com.example.skillforge.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class UserSkillLevelResponse {
    private String skill;
    private double score;
    private boolean mastered;
}
