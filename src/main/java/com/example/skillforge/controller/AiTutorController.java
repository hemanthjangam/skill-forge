package com.example.skillforge.controller;

import com.example.skillforge.dto.AiMockGenerateRequest;
import com.example.skillforge.dto.AiMockGenerateResponse;
import com.example.skillforge.dto.AiTutorDoubtRequest;
import com.example.skillforge.dto.AiTutorDoubtResponse;
import com.example.skillforge.dto.AiTutorFeedbackRequest;
import com.example.skillforge.dto.AiTutorFeedbackResponse;
import com.example.skillforge.dto.AiTutorTeachRequest;
import com.example.skillforge.dto.AiTutorTeachResponse;
import com.example.skillforge.entity.User;
import com.example.skillforge.service.AiTutorService;
import com.example.skillforge.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Exposes the Gemini-backed AI tutor endpoints used by the Skill Mastery experience.
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/ai")
public class AiTutorController {

    private final AiTutorService aiTutorService;
    private final UserService userService;

    /**
     * Generates a structured teaching response for a selected concept.
     */
    @PostMapping("/tutor/teach")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<AiTutorTeachResponse> teach(Authentication authentication,
            @Valid @RequestBody AiTutorTeachRequest request) {
        User student = userService.getRequiredUserByEmail(authentication.getName());
        return ResponseEntity.ok(aiTutorService.teachConcept(student, request));
    }

    /**
     * Answers a student doubt using course-aware tutor context and recent chat history.
     */
    @PostMapping("/tutor/doubt")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<AiTutorDoubtResponse> doubt(Authentication authentication,
            @Valid @RequestBody AiTutorDoubtRequest request) {
        User student = userService.getRequiredUserByEmail(authentication.getName());
        return ResponseEntity.ok(aiTutorService.answerDoubt(student, request));
    }

    /**
     * Reviews a student reflection and returns structured feedback.
     */
    @PostMapping("/tutor/feedback")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<AiTutorFeedbackResponse> feedback(Authentication authentication,
            @Valid @RequestBody AiTutorFeedbackRequest request) {
        User student = userService.getRequiredUserByEmail(authentication.getName());
        return ResponseEntity.ok(aiTutorService.reviewReflection(student, request));
    }

    /**
     * Generates mock scenarios from the student's completed courses.
     */
    @PostMapping("/mock/generate")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<AiMockGenerateResponse> generateMocks(Authentication authentication,
            @RequestBody(required = false) AiMockGenerateRequest request) {
        User student = userService.getRequiredUserByEmail(authentication.getName());
        AiMockGenerateRequest safeRequest = request == null ? new AiMockGenerateRequest() : request;
        return ResponseEntity.ok(aiTutorService.generateMocks(student, safeRequest));
    }
}
