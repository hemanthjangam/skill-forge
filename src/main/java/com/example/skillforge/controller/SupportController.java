package com.example.skillforge.controller;

import com.example.skillforge.dto.DoubtCreateRequest;
import com.example.skillforge.dto.DoubtResolveRequest;
import com.example.skillforge.dto.DoubtResponse;
import com.example.skillforge.dto.StudentSupportSummaryResponse;
import com.example.skillforge.entity.User;
import com.example.skillforge.service.StudentSupportService;
import com.example.skillforge.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
public class SupportController {

    private final StudentSupportService studentSupportService;
    private final UserService userService;

    @GetMapping("/student/support/summary")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<StudentSupportSummaryResponse> summary(Authentication authentication) {
        User student = userService.getRequiredUserByEmail(authentication.getName());
        return ResponseEntity.ok(studentSupportService.getStudentSummary(student));
    }

    @PostMapping("/doubts")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<DoubtResponse> createDoubt(Authentication authentication,
            @Valid @RequestBody DoubtCreateRequest request) {
        User student = userService.getRequiredUserByEmail(authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(studentSupportService.createDoubt(student, request));
    }

    @GetMapping("/doubts/me")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<List<DoubtResponse>> myDoubts(Authentication authentication) {
        User student = userService.getRequiredUserByEmail(authentication.getName());
        return ResponseEntity.ok(studentSupportService.getStudentDoubts(student));
    }

    @GetMapping("/doubts/open")
    @PreAuthorize("hasAnyRole('TRAINER','ADMIN')")
    public ResponseEntity<List<DoubtResponse>> openDoubts(Authentication authentication) {
        User reviewer = userService.getRequiredUserByEmail(authentication.getName());
        return ResponseEntity.ok(studentSupportService.getOpenDoubts(reviewer));
    }

    @PatchMapping("/doubts/{doubtId}/resolve")
    @PreAuthorize("hasAnyRole('TRAINER','ADMIN')")
    public ResponseEntity<DoubtResponse> resolveDoubt(Authentication authentication,
            @PathVariable Long doubtId,
            @Valid @RequestBody DoubtResolveRequest request) {
        User reviewer = userService.getRequiredUserByEmail(authentication.getName());
        return ResponseEntity.ok(studentSupportService.resolveDoubt(reviewer, doubtId, request));
    }
}
