package com.example.skillforge.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class ExamSummaryResponse {
    private Long examId;
    private Long courseId;
    private String courseTitle;
    private String title;
    private String description;
    private Integer questionCount;
    private Integer durationMinutes;
    private LocalDateTime createdAt;
}
