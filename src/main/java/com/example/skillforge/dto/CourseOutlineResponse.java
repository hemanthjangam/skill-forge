package com.example.skillforge.dto;

import com.example.skillforge.entity.CourseApprovalStatus;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class CourseOutlineResponse {
    private Long courseId;
    private String title;
    private String description;
    private CourseApprovalStatus approvalStatus;
    private Long trainerId;
    private String trainerName;
    private List<CourseOutlineModuleResponse> modules;
    @JsonProperty("isEnrolled")
    private boolean isEnrolled;
    private int progressPercentage;
}
