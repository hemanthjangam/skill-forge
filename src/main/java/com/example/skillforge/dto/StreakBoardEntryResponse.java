package com.example.skillforge.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class StreakBoardEntryResponse {
    private int rank;
    private Long userId;
    private String userName;
    private int currentStreak;
    private int bestStreak;
    private int totalKnowledgeChecks;
    private int points;
}
