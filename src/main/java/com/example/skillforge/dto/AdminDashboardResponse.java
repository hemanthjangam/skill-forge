package com.example.skillforge.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AdminDashboardResponse {
    private long totalUsers;
    private long activeUsers;
    private long inactiveUsers;
    private long pendingTrainerApprovals;
    private long pendingCourseApprovals;
    private long approvedCourses;
}
