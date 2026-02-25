package com.example.skillforge.service;

import com.example.skillforge.dto.*;
import com.example.skillforge.entity.*;
import com.example.skillforge.exception.ApiException;
import com.example.skillforge.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CourseService {

    private final CourseRepository courseRepository;
    private final LearningModuleRepository learningModuleRepository;
    private final LessonRepository lessonRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final NotificationService notificationService;

    @Transactional
    public CourseResponse createCourse(User trainer, CourseCreateRequest request) {
        ensureTrainer(trainer);

        Course course = courseRepository.save(Course.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .createdBy(trainer)
                .approvalStatus(CourseApprovalStatus.DRAFT)
                .build());

        return toDto(course);
    }

    @Transactional
    public ModuleResponse addModule(User trainer, Long courseId, ModuleCreateRequest request) {
        Course course = getCourse(courseId);
        if (!course.getCreatedBy().getId().equals(trainer.getId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only course owner can add modules");
        }

        LearningModule module = learningModuleRepository.save(LearningModule.builder()
                .title(request.getTitle())
                .course(course)
                .build());

        return ModuleResponse.builder()
                .id(module.getId())
                .title(module.getTitle())
                .courseId(course.getId())
                .build();
    }

    @Transactional
    public LessonResponse addLesson(User trainer, Long moduleId, LessonCreateRequest request) {
        LearningModule module = getModule(moduleId);
        if (!module.getCourse().getCreatedBy().getId().equals(trainer.getId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only course owner can add lessons");
        }

        Lesson lesson = lessonRepository.save(Lesson.builder()
                .title(request.getTitle())
                .content(request.getContent())
                .module(module)
                .build());

        return LessonResponse.builder()
                .id(lesson.getId())
                .title(lesson.getTitle())
                .content(lesson.getContent())
                .moduleId(module.getId())
                .build();
    }

    @Transactional
    public CourseResponse submitForApproval(User trainer, Long courseId) {
        Course course = getCourse(courseId);
        if (!course.getCreatedBy().getId().equals(trainer.getId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only owner can submit course");
        }
        course.setApprovalStatus(CourseApprovalStatus.PENDING);
        return toDto(courseRepository.save(course));
    }

    @Transactional
    public CourseResponse moderateCourse(Long courseId, CourseApprovalRequest request) {
        Course course = getCourse(courseId);
        course.setApprovalStatus(request.getApproved() ? CourseApprovalStatus.APPROVED : CourseApprovalStatus.REJECTED);
        course = courseRepository.save(course);

        notificationService.createNotification(course.getCreatedBy(),
                "Course '" + course.getTitle() + "' was " + course.getApprovalStatus().name().toLowerCase());

        return toDto(course);
    }

    public PagedResponse<CourseResponse> getPublishedCourses(int page, int size) {
        Page<Course> result = courseRepository.findByApprovalStatus(CourseApprovalStatus.APPROVED, PageRequest.of(page, size));
        return PagedResponse.<CourseResponse>builder()
                .content(result.getContent().stream().map(this::toDto).toList())
                .page(result.getNumber())
                .size(result.getSize())
                .totalElements(result.getTotalElements())
                .totalPages(result.getTotalPages())
                .build();
    }

    @Transactional
    public EnrollmentResponse enroll(User student, Long courseId) {
        if (student.getRole() != Role.STUDENT) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only students can enroll");
        }

        Course course = getCourse(courseId);
        if (course.getApprovalStatus() != CourseApprovalStatus.APPROVED) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Course is not published");
        }
        if (enrollmentRepository.existsByStudentAndCourse(student, course)) {
            throw new ApiException(HttpStatus.CONFLICT, "Already enrolled");
        }

        Enrollment enrollment = enrollmentRepository.save(Enrollment.builder()
                .student(student)
                .course(course)
                .build());

        notificationService.createNotification(student, "You enrolled in course '" + course.getTitle() + "'");
        notificationService.createNotification(course.getCreatedBy(), student.getName() + " enrolled in '" + course.getTitle() + "'");

        return EnrollmentResponse.builder()
                .enrollmentId(enrollment.getId())
                .studentId(student.getId())
                .courseId(course.getId())
                .enrolledAt(enrollment.getEnrolledAt())
                .build();
    }

    public Course getCourse(Long id) {
        return courseRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Course not found"));
    }

    public LearningModule getModule(Long id) {
        return learningModuleRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Module not found"));
    }

    private void ensureTrainer(User user) {
        if (user.getRole() != Role.TRAINER) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only trainers can perform this action");
        }
        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Trainer account is not active");
        }
    }

    private CourseResponse toDto(Course course) {
        return CourseResponse.builder()
                .id(course.getId())
                .title(course.getTitle())
                .description(course.getDescription())
                .approvalStatus(course.getApprovalStatus())
                .trainerId(course.getCreatedBy().getId())
                .trainerName(course.getCreatedBy().getName())
                .createdAt(course.getCreatedAt())
                .build();
    }
}
