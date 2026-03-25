package com.example.skillforge.controller;

import com.example.skillforge.dto.AdminDashboardResponse;
import com.example.skillforge.dto.StudentActivityPointResponse;
import com.example.skillforge.dto.StudentDashboardResponse;
import com.example.skillforge.dto.TrainerDashboardResponse;
import com.example.skillforge.entity.User;
import com.example.skillforge.service.DashboardService;
import com.example.skillforge.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;
    private final UserService userService;

    /**
     * Returns the student dashboard summary for the authenticated learner.
     */
    @GetMapping("/student")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<StudentDashboardResponse> studentSummary(Authentication authentication) {
        User student = userService.getRequiredUserByEmail(authentication.getName());
        return ResponseEntity.ok(dashboardService.studentSummary(student));
    }

    /**
     * Returns daily activity points for the student dashboard charts and streak views.
     */
    @GetMapping("/student/activity")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<List<StudentActivityPointResponse>> studentActivity(Authentication authentication,
            @RequestParam(defaultValue = "182") int days) {
        User student = userService.getRequiredUserByEmail(authentication.getName());
        return ResponseEntity.ok(dashboardService.studentActivity(student, days));
    }

    /**
     * Returns the trainer dashboard summary for the authenticated trainer.
     */
    @GetMapping("/trainer")
    @PreAuthorize("hasRole('TRAINER')")
    public ResponseEntity<TrainerDashboardResponse> trainerSummary(Authentication authentication) {
        User trainer = userService.getRequiredUserByEmail(authentication.getName());
        return ResponseEntity.ok(dashboardService.trainerSummary(trainer));
    }

    /**
     * Returns the platform-level admin dashboard summary.
     */
    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdminDashboardResponse> adminSummary() {
        return ResponseEntity.ok(dashboardService.adminSummary());
    }
}
