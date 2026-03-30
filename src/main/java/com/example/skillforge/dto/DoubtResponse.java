package com.example.skillforge.dto;

import com.example.skillforge.entity.DoubtStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class DoubtResponse {
    private Long id;
    private Long studentId;
    private String studentName;
    private Long courseId;
    private String courseTitle;
    private Long moduleId;
    private String moduleTitle;
    private String concept;
    private String question;
    private DoubtStatus status;
    private String resolution;
    private String resolvedByName;
    private LocalDateTime createdAt;
    private LocalDateTime resolvedAt;
}
