package com.example.skillforge.controller;

import com.example.skillforge.dto.*;
import com.example.skillforge.entity.User;
import com.example.skillforge.service.CourseService;
import com.example.skillforge.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
public class CourseController {

    private final CourseService courseService;
    private final UserService userService;

    @PostMapping("/courses")
    @PreAuthorize("hasRole('TRAINER')")
    public ResponseEntity<CourseResponse> createCourse(Authentication authentication,
                                                       @Valid @RequestBody CourseCreateRequest request) {
        User trainer = userService.getRequiredUserByEmail(authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(courseService.createCourse(trainer, request));
    }

    @PostMapping("/courses/{courseId}/modules")
    @PreAuthorize("hasRole('TRAINER')")
    public ResponseEntity<ModuleResponse> addModule(Authentication authentication,
                                                    @PathVariable Long courseId,
                                                    @Valid @RequestBody ModuleCreateRequest request) {
        User trainer = userService.getRequiredUserByEmail(authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(courseService.addModule(trainer, courseId, request));
    }

    @PostMapping("/modules/{moduleId}/lessons")
    @PreAuthorize("hasRole('TRAINER')")
    public ResponseEntity<LessonResponse> addLesson(Authentication authentication,
                                                    @PathVariable Long moduleId,
                                                    @Valid @RequestBody LessonCreateRequest request) {
        User trainer = userService.getRequiredUserByEmail(authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(courseService.addLesson(trainer, moduleId, request));
    }

    @PostMapping("/courses/{courseId}/submit")
    @PreAuthorize("hasRole('TRAINER')")
    public ResponseEntity<CourseResponse> submitForApproval(Authentication authentication, @PathVariable Long courseId) {
        User trainer = userService.getRequiredUserByEmail(authentication.getName());
        return ResponseEntity.ok(courseService.submitForApproval(trainer, courseId));
    }

    @PatchMapping("/admin/courses/{courseId}/approval")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CourseResponse> moderateCourse(@PathVariable Long courseId,
                                                         @Valid @RequestBody CourseApprovalRequest request) {
        return ResponseEntity.ok(courseService.moderateCourse(courseId, request));
    }

    @GetMapping("/courses/published")
    public ResponseEntity<PagedResponse<CourseResponse>> published(@RequestParam(defaultValue = "0") int page,
                                                                   @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(courseService.getPublishedCourses(page, size));
    }

    @PostMapping("/courses/{courseId}/enroll")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<EnrollmentResponse> enroll(Authentication authentication,
                                                     @PathVariable Long courseId) {
        User student = userService.getRequiredUserByEmail(authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(courseService.enroll(student, courseId));
    }
}
