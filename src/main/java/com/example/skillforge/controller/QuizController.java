package com.example.skillforge.controller;

import com.example.skillforge.dto.QuizSubmitRequest;
import com.example.skillforge.dto.QuizSubmitResponse;
import com.example.skillforge.dto.UserSkillLevelResponse;
import com.example.skillforge.entity.User;
import com.example.skillforge.service.QuizService;
import com.example.skillforge.service.SkillTrackingService;
import com.example.skillforge.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
public class QuizController {

    private final QuizService quizService;
    private final UserService userService;
    private final SkillTrackingService skillTrackingService;

    @PostMapping("/quiz/submit")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<QuizSubmitResponse> submit(Authentication authentication,
                                                     @Valid @RequestBody QuizSubmitRequest request) {
        User student = userService.getRequiredUserByEmail(authentication.getName());
        return ResponseEntity.ok(quizService.submitQuiz(student, request));
    }

    @GetMapping("/skills/me")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<List<UserSkillLevelResponse>> mySkills(Authentication authentication) {
        User student = userService.getRequiredUserByEmail(authentication.getName());
        return ResponseEntity.ok(skillTrackingService.getUserSkills(student));
    }
}
