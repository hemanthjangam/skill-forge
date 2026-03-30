package com.example.skillforge.dto;

import com.example.skillforge.entity.AchievementBadgeCode;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class AchievementBadgeResponse {
    private AchievementBadgeCode badgeCode;
    private String title;
    private String description;
    private LocalDateTime awardedAt;
}
