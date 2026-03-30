package com.example.skillforge.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class ExamStartResponse {
    private Long attemptId;
    private Long examId;
    private String title;
    private Integer durationMinutes;
    private LocalDateTime startedAt;
    private List<ExamQuestionResponse> questions;
}
