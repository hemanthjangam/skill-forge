package com.example.skillforge.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class StudentSupportSummaryResponse {
    private long openDoubts;
    private long examsTaken;
    private List<AchievementBadgeResponse> badges;
    private List<CourseCertificateResponse> certificates;
    private List<CourseRecommendationResponse> recommendations;
    private List<DoubtResponse> recentDoubts;
}
