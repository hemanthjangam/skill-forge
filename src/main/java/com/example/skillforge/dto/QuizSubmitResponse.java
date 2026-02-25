package com.example.skillforge.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.Map;

@Getter
@Builder
public class QuizSubmitResponse {
    private Long attemptId;
    private int totalQuestions;
    private int correctAnswers;
    private double scorePercentage;
    private Map<String, Double> conceptAccuracy;
    private LocalDateTime attemptedAt;
}
