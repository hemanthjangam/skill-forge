package com.example.skillforge.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class ExamSubmitResponse {
    private Long attemptId;
    private Long examId;
    private String examTitle;
    private Double scorePercentage;
    private Integer correctAnswers;
    private Integer totalQuestions;
    private Double proctoringScore;
    private Integer violationCount;
    private String feedbackSummary;
    private LocalDateTime submittedAt;
    private List<ExamQuestionResponse> questions;
}
