package com.example.skillforge.controller;

import com.example.skillforge.dto.AdminDashboardResponse;
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
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;
    private final UserService userService;

    @GetMapping("/student")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<StudentDashboardResponse> studentSummary(Authentication authentication) {
        User student = userService.getRequiredUserByEmail(authentication.getName());
        return ResponseEntity.ok(dashboardService.studentSummary(student));
    }

    @GetMapping("/trainer")
    @PreAuthorize("hasRole('TRAINER')")
    public ResponseEntity<TrainerDashboardResponse> trainerSummary(Authentication authentication) {
        User trainer = userService.getRequiredUserByEmail(authentication.getName());
        return ResponseEntity.ok(dashboardService.trainerSummary(trainer));
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdminDashboardResponse> adminSummary() {
        return ResponseEntity.ok(dashboardService.adminSummary());
    }
}
