package com.example.skillforge.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class EnrollmentResponse {
    private Long enrollmentId;
    private Long studentId;
    private Long courseId;
    private LocalDateTime enrolledAt;
}
