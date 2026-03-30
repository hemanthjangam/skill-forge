package com.example.skillforge.controller;

import com.example.skillforge.dto.ExamAttemptReviewResponse;
import com.example.skillforge.dto.ExamDetailResponse;
import com.example.skillforge.dto.ExamGenerateRequest;
import com.example.skillforge.dto.ExamStartResponse;
import com.example.skillforge.dto.ExamSubmitRequest;
import com.example.skillforge.dto.ExamSubmitResponse;
import com.example.skillforge.dto.ExamSummaryResponse;
import com.example.skillforge.dto.MessageResponse;
import com.example.skillforge.dto.ProctorEventRequest;
import com.example.skillforge.entity.User;
import com.example.skillforge.service.ExamService;
import com.example.skillforge.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
public class ExamController {

    private final ExamService examService;
    private final UserService userService;

    @PostMapping("/trainer/courses/{courseId}/exams/generate")
    @PreAuthorize("hasAnyRole('TRAINER','ADMIN')")
    public ResponseEntity<ExamSummaryResponse> generateExam(Authentication authentication,
            @PathVariable Long courseId,
            @Valid @RequestBody ExamGenerateRequest request) {
        User author = userService.getRequiredUserByEmail(authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(examService.generateExam(author, courseId, request));
    }

    @GetMapping("/trainer/exams")
    @PreAuthorize("hasAnyRole('TRAINER','ADMIN')")
    public ResponseEntity<List<ExamSummaryResponse>> trainerExams(Authentication authentication) {
        User author = userService.getRequiredUserByEmail(authentication.getName());
        return ResponseEntity.ok(examService.getTrainerExams(author));
    }

    @GetMapping("/courses/{courseId}/exams")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<List<ExamSummaryResponse>> courseExams(Authentication authentication, @PathVariable Long courseId) {
        User student = userService.getRequiredUserByEmail(authentication.getName());
        return ResponseEntity.ok(examService.getCourseExams(student, courseId));
    }

    @GetMapping("/exams/{examId}")
    @PreAuthorize("hasAnyRole('STUDENT','TRAINER','ADMIN')")
    public ResponseEntity<ExamDetailResponse> examDetail(Authentication authentication, @PathVariable Long examId) {
        User requester = userService.getRequiredUserByEmail(authentication.getName());
        return ResponseEntity.ok(examService.getExamDetail(requester, examId));
    }

    @PostMapping("/exams/{examId}/attempts/start")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ExamStartResponse> start(Authentication authentication, @PathVariable Long examId) {
        User student = userService.getRequiredUserByEmail(authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(examService.startExam(student, examId));
    }

    @PostMapping("/exam-attempts/{attemptId}/proctor-events")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<MessageResponse> proctorEvent(Authentication authentication,
            @PathVariable Long attemptId,
            @Valid @RequestBody ProctorEventRequest request) {
        User student = userService.getRequiredUserByEmail(authentication.getName());
        examService.recordProctorEvent(student, attemptId, request);
        return ResponseEntity.ok(new MessageResponse("Proctoring event recorded"));
    }

    @PostMapping("/exam-attempts/{attemptId}/submit")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ExamSubmitResponse> submit(Authentication authentication,
            @PathVariable Long attemptId,
            @Valid @RequestBody ExamSubmitRequest request) {
        User student = userService.getRequiredUserByEmail(authentication.getName());
        return ResponseEntity.ok(examService.submitAttempt(student, attemptId, request));
    }

    @GetMapping("/exam-attempts/{attemptId}")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ExamAttemptReviewResponse> review(Authentication authentication, @PathVariable Long attemptId) {
        User student = userService.getRequiredUserByEmail(authentication.getName());
        return ResponseEntity.ok(examService.getAttemptReview(student, attemptId));
    }
}
