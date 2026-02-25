package com.example.skillforge.dto;

import com.example.skillforge.entity.CourseApprovalStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class CourseResponse {
    private Long id;
    private String title;
    private String description;
    private CourseApprovalStatus approvalStatus;
    private Long trainerId;
    private String trainerName;
    private LocalDateTime createdAt;
}
