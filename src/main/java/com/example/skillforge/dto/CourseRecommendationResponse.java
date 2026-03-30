package com.example.skillforge.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class CourseRecommendationResponse {
    private Long courseId;
    private String courseTitle;
    private String rationale;
    private double matchScore;
}
