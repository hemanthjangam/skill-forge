package com.example.skillforge.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class StudentDashboardResponse {
    private long enrolledCourses;
    private long quizAttempts;
    private double averageQuizScore;
    private long unreadNotifications;
}
