package com.example.skillforge.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;

@Getter
@Builder
public class StreakSummaryResponse {
    private Long userId;
    private String userName;
    private int currentStreak;
    private int bestStreak;
    private int totalKnowledgeChecks;
    private int points;
    private LocalDate lastActiveDate;
}
