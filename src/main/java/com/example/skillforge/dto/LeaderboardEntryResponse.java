package com.example.skillforge.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class LeaderboardEntryResponse {
    private int rank;
    private Long userId;
    private String userName;
    private int points;
}
