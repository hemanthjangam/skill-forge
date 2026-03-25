package com.example.skillforge.controller;

import com.example.skillforge.dto.QuestionCreateRequest;
import com.example.skillforge.dto.QuestionForQuizResponse;
import com.example.skillforge.dto.QuestionPoolItemResponse;
import com.example.skillforge.dto.QuestionResponse;
import com.example.skillforge.entity.User;
import com.example.skillforge.service.QuestionService;
import com.example.skillforge.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
public class QuestionController {

    private final QuestionService questionService;
    private final UserService userService;

    /**
     * Adds a question to a module's trainer-managed question pool.
     */
    @PostMapping("/modules/{moduleId}/questions")
    @PreAuthorize("hasRole('TRAINER')")
    public ResponseEntity<QuestionResponse> addQuestion(Authentication authentication,
            @PathVariable Long moduleId,
            @Valid @RequestBody QuestionCreateRequest request) {
        User trainer = userService.getRequiredUserByEmail(authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(questionService.addQuestion(trainer, moduleId, request));
    }

    /**
     * Returns the default module quiz questions for an enrolled student.
     */
    @GetMapping("/modules/{moduleId}/quiz/questions")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<List<QuestionForQuizResponse>> quizQuestions(Authentication authentication,
            @PathVariable Long moduleId) {
        User student = userService.getRequiredUserByEmail(authentication.getName());
        return ResponseEntity.ok(questionService.getQuizQuestions(student, moduleId));
    }

    /**
     * Returns lesson-focused quiz questions for an enrolled student.
     */
    @GetMapping("/lessons/{lessonId}/quiz/questions")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<List<QuestionForQuizResponse>> lessonQuizQuestions(Authentication authentication,
            @PathVariable Long lessonId) {
        User student = userService.getRequiredUserByEmail(authentication.getName());
        return ResponseEntity.ok(questionService.getQuizQuestionsByLesson(student, lessonId));
    }

    /**
     * Returns the complete trainer-visible question pool for a module.
     */
    @GetMapping("/modules/{moduleId}/questions")
    @PreAuthorize("hasRole('TRAINER')")
    public ResponseEntity<List<QuestionPoolItemResponse>> questionPool(Authentication authentication,
            @PathVariable Long moduleId) {
        User trainer = userService.getRequiredUserByEmail(authentication.getName());
        return ResponseEntity.ok(questionService.getModuleQuestionPool(trainer, moduleId));
    }
}
