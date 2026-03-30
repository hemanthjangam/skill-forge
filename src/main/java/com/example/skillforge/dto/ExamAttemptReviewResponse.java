package com.example.skillforge.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class ExamAttemptReviewResponse {
    private Long attemptId;
    private Long examId;
    private String examTitle;
    private String courseTitle;
    private Double scorePercentage;
    private Integer correctAnswers;
    private Integer totalQuestions;
    private Double proctoringScore;
    private Integer violationCount;
    private LocalDateTime startedAt;
    private LocalDateTime submittedAt;
    private List<ExamQuestionResponse> questions;
}
