package com.example.skillforge.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class ExamDetailResponse {
    private Long examId;
    private Long courseId;
    private String courseTitle;
    private String title;
    private String description;
    private Integer questionCount;
    private Integer durationMinutes;
    private List<ExamQuestionResponse> questions;
}
