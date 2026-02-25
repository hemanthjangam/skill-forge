package com.example.skillforge.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class TrainerDashboardResponse {
    private long createdCourses;
    private long pendingCourseApprovals;
    private long totalEnrollments;
    private long questionsCreated;
    private long quizAttemptsOnTrainerModules;
}
