package com.example.skillforge.controller;

import com.example.skillforge.dto.*;
import com.example.skillforge.entity.CourseApprovalStatus;
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

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
public class CourseController {

    private final CourseService courseService;
    private final UserService userService;

    /**
     * Creates a draft course for the authenticated trainer.
     */
    @PostMapping("/courses")
    @PreAuthorize("hasRole('TRAINER')")
    public ResponseEntity<CourseResponse> createCourse(Authentication authentication,
            @Valid @RequestBody CourseCreateRequest request) {
        User trainer = userService.getRequiredUserByEmail(authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(courseService.createCourse(trainer, request));
    }

    /**
     * Adds a module to an owned course.
     */
    @PostMapping("/courses/{courseId}/modules")
    @PreAuthorize("hasRole('TRAINER')")
    public ResponseEntity<ModuleResponse> addModule(Authentication authentication,
            @PathVariable Long courseId,
            @Valid @RequestBody ModuleCreateRequest request) {
        User trainer = userService.getRequiredUserByEmail(authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(courseService.addModule(trainer, courseId, request));
    }

    /**
     * Adds a lesson to an owned module.
     */
    @PostMapping("/modules/{moduleId}/lessons")
    @PreAuthorize("hasRole('TRAINER')")
    public ResponseEntity<LessonResponse> addLesson(Authentication authentication,
            @PathVariable Long moduleId,
            @Valid @RequestBody LessonCreateRequest request) {
        User trainer = userService.getRequiredUserByEmail(authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(courseService.addLesson(trainer, moduleId, request));
    }

    /**
     * Submits a trainer-owned course for admin review.
     */
    @PostMapping("/courses/{courseId}/submit")
    @PreAuthorize("hasRole('TRAINER')")
    public ResponseEntity<CourseResponse> submitForApproval(Authentication authentication,
            @PathVariable Long courseId) {
        User trainer = userService.getRequiredUserByEmail(authentication.getName());
        return ResponseEntity.ok(courseService.submitForApproval(trainer, courseId));
    }

    /**
     * Approves or rejects a pending course.
     */
    @PatchMapping("/admin/courses/{courseId}/approval")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CourseResponse> moderateCourse(@PathVariable Long courseId,
            @Valid @RequestBody CourseApprovalRequest request) {
        return ResponseEntity.ok(courseService.moderateCourse(courseId, request));
    }

    /**
     * Returns all courses for admin moderation views.
     */
    @GetMapping("/admin/courses")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PagedResponse<CourseResponse>> getAllCoursesForAdmin(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) CourseApprovalStatus status) {
        return ResponseEntity.ok(courseService.getAllCoursesForAdmin(page, size, status));
    }

    /**
     * Returns the published course catalog.
     */
    @GetMapping("/courses/published")
    public ResponseEntity<PagedResponse<CourseResponse>> published(@RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(courseService.getPublishedCourses(page, size));
    }

    /**
     * Returns the authenticated trainer's uploaded courses.
     */
    @GetMapping("/trainer/courses")
    @PreAuthorize("hasRole('TRAINER')")
    public ResponseEntity<List<CourseResponse>> trainerCourses(Authentication authentication) {
        User trainer = userService.getRequiredUserByEmail(authentication.getName());
        return ResponseEntity.ok(courseService.getTrainerCourses(trainer));
    }

    /**
     * Deletes a trainer-owned course.
     */
    @DeleteMapping("/courses/{courseId}")
    @PreAuthorize("hasRole('TRAINER')")
    public ResponseEntity<Void> deleteCourse(Authentication authentication, @PathVariable Long courseId) {
        User trainer = userService.getRequiredUserByEmail(authentication.getName());
        courseService.deleteCourse(trainer, courseId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Returns the course outline for a visible course.
     */
    @GetMapping("/courses/{courseId}/outline")
    public ResponseEntity<CourseOutlineResponse> outline(Authentication authentication,
            @PathVariable Long courseId) {
        User requester = userService.getRequiredUserByEmail(authentication.getName());
        return ResponseEntity.ok(courseService.getCourseOutline(requester, courseId));
    }

    /**
     * Enrolls the authenticated student in an approved course.
     */
    @PostMapping("/courses/{courseId}/enroll")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<EnrollmentResponse> enrollInCourse(Authentication authentication,
            @PathVariable Long courseId) {
        User student = userService.getRequiredUserByEmail(authentication.getName());
        return ResponseEntity.ok(courseService.enroll(student, courseId));
    }

    /**
     * Marks a lesson as completed for the authenticated student.
     */
    @PostMapping("/lessons/{lessonId}/complete")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<Void> markLessonComplete(Authentication authentication, @PathVariable Long lessonId) {
        User student = userService.getRequiredUserByEmail(authentication.getName());
        courseService.markLessonComplete(student, lessonId);
        return ResponseEntity.ok().build();
    }
}
