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

import java.util.List;

@Service
@RequiredArgsConstructor
public class CourseService {

    private final CourseRepository courseRepository;
    private final LearningModuleRepository learningModuleRepository;
    private final LessonRepository lessonRepository;
    private final QuestionRepository questionRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final NotificationService notificationService;
    private final LessonProgressRepository lessonProgressRepository;
    private final QuizAttemptRepository quizAttemptRepository;

    /**
     * Creates a new draft course for an active trainer.
     */
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

    /**
     * Appends a module to a trainer-owned course.
     */
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

    /**
     * Appends a lesson to a trainer-owned module after validating content payload rules.
     */
    @Transactional
    public LessonResponse addLesson(User trainer, Long moduleId, LessonCreateRequest request) {
        LearningModule module = getModule(moduleId);
        if (!module.getCourse().getCreatedBy().getId().equals(trainer.getId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only course owner can add lessons");
        }
        validateLessonContent(request);

        Lesson lesson = lessonRepository.save(Lesson.builder()
                .title(request.getTitle())
                .contentType(request.getContentType())
                .textContent(request.getTextContent())
                .imageUrl(request.getImageUrl())
                .videoUrl(request.getVideoUrl())
                .module(module)
                .build());

        return LessonResponse.builder()
                .id(lesson.getId())
                .title(lesson.getTitle())
                .contentType(lesson.getContentType())
                .textContent(lesson.getTextContent())
                .imageUrl(lesson.getImageUrl())
                .videoUrl(lesson.getVideoUrl())
                .moduleId(module.getId())
                .build();
    }

    /**
     * Moves a trainer-owned course from draft to pending approval.
     */
    @Transactional
    public CourseResponse submitForApproval(User trainer, Long courseId) {
        Course course = getCourse(courseId);
        if (!course.getCreatedBy().getId().equals(trainer.getId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only owner can submit course");
        }
        course.setApprovalStatus(CourseApprovalStatus.PENDING);
        return toDto(courseRepository.save(course));
    }

    /**
     * Approves or rejects a course and notifies the trainer of the moderation result.
     */
    @Transactional
    public CourseResponse moderateCourse(Long courseId, CourseApprovalRequest request) {
        Course course = getCourse(courseId);
        course.setApprovalStatus(request.getApproved() ? CourseApprovalStatus.APPROVED : CourseApprovalStatus.REJECTED);
        course = courseRepository.save(course);

        notificationService.createNotification(course.getCreatedBy(),
                "Course '" + course.getTitle() + "' was " + course.getApprovalStatus().name().toLowerCase());

        return toDto(course);
    }

    /**
     * Returns all courses for admin review, optionally filtered by approval status.
     */
    public PagedResponse<CourseResponse> getAllCoursesForAdmin(int page, int size, CourseApprovalStatus status) {
        Page<Course> result;
        PageRequest pageRequest = PageRequest.of(page, size);
        if (status != null) {
            result = courseRepository.findByApprovalStatus(status, pageRequest);
        } else {
            result = courseRepository.findAll(pageRequest);
        }

        return PagedResponse.<CourseResponse>builder()
                .content(result.getContent().stream().map(this::toDto).toList())
                .page(result.getNumber())
                .size(result.getSize())
                .totalElements(result.getTotalElements())
                .totalPages(result.getTotalPages())
                .build();
    }

    /**
     * Returns only approved courses that can be shown in the public catalog.
     */
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

    /**
     * Returns the authenticated trainer's courses ordered by newest first.
     */
    public List<CourseResponse> getTrainerCourses(User trainer) {
        ensureTrainer(trainer);
        return courseRepository.findByCreatedByOrderByCreatedAtDesc(trainer).stream()
                .map(this::toDto)
                .toList();
    }

    /**
     * Deletes a trainer-owned course along with dependent learner progress and quiz attempts.
     */
    @Transactional
    public void deleteCourse(User trainer, Long courseId) {
        ensureTrainer(trainer);

        Course course = getCourse(courseId);
        if (!course.getCreatedBy().getId().equals(trainer.getId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only course owner can delete course");
        }

        List<LearningModule> modules = learningModuleRepository.findByCourse(course);
        if (!modules.isEmpty()) {
            List<Lesson> lessons = lessonRepository.findByModuleIn(modules);
            if (!lessons.isEmpty()) {
                lessonProgressRepository.deleteByLessonIn(lessons);
            }
            quizAttemptRepository.deleteByModuleIn(modules);
        }

        courseRepository.delete(course);
    }

    /**
     * Builds the course outline payload with modules, lessons, enrollment, and progress state.
     */
    public CourseOutlineResponse getCourseOutline(User requester, Long courseId) {
        Course course = getCourse(courseId);
        ensureCourseVisibleToRequester(requester, course);

        boolean isEnrolled = false;
        List<Long> completedLessonIds = List.of();
        
        if (requester.getRole() == Role.STUDENT) {
            isEnrolled = enrollmentRepository.existsByStudentAndCourse(requester, course);
            if (isEnrolled) {
                completedLessonIds = lessonProgressRepository.findCompletedLessonIdsByStudentAndCourse(requester.getId(), courseId);
            }
        }

        final List<Long> finalCompletedLessonIds = completedLessonIds;

        List<CourseOutlineModuleResponse> modules = learningModuleRepository.findByCourseOrderByIdAsc(course).stream()
                .map(module -> {
                    List<CourseOutlineLessonResponse> lessons = lessonRepository.findByModuleOrderByIdAsc(module).stream()
                            .map(lesson -> {
                                boolean isCompleted = finalCompletedLessonIds.contains(lesson.getId());
                                return CourseOutlineLessonResponse.builder()
                                        .id(lesson.getId())
                                        .title(lesson.getTitle())
                                        .contentType(lesson.getContentType() == null ? LessonContentType.TEXT : lesson.getContentType())
                                        .textContent(lesson.getTextContent())
                                        .imageUrl(lesson.getImageUrl())
                                        .videoUrl(lesson.getVideoUrl())
                                        .isCompleted(isCompleted)
                                        .build();
                            })
                            .toList();

                    return CourseOutlineModuleResponse.builder()
                            .id(module.getId())
                            .title(module.getTitle())
                            .questionCount(questionRepository.countByModule(module))
                            .lessons(lessons)
                            .build();
                })
                .toList();

        int totalLessons = 0;
        int completedCount = 0;
        for (CourseOutlineModuleResponse module : modules) {
            totalLessons += module.getLessons().size();
            for (CourseOutlineLessonResponse lesson : module.getLessons()) {
                if (lesson.isCompleted()) completedCount++;
            }
        }
        
        int progressPercentage = totalLessons == 0 ? 0 : (int) Math.round((completedCount * 100.0) / totalLessons);

        return CourseOutlineResponse.builder()
                .courseId(course.getId())
                .title(course.getTitle())
                .description(course.getDescription())
                .approvalStatus(course.getApprovalStatus())
                .trainerId(course.getCreatedBy().getId())
                .trainerName(course.getCreatedBy().getName())
                .modules(modules)
                .isEnrolled(isEnrolled)
                .progressPercentage(progressPercentage)
                .build();
    }

    /**
     * Enrolls a student in an approved course and emits the related notifications.
     */
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

    /**
     * Records lesson completion once student enrollment has been verified.
     */
    @Transactional
    public void markLessonComplete(User student, Long lessonId) {
        if (student.getRole() != Role.STUDENT) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only students can complete lessons");
        }
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Lesson not found"));
        Course course = lesson.getModule().getCourse();
        if (!enrollmentRepository.existsByStudentAndCourse(student, course)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Not enrolled in this course");
        }
        if (!lessonProgressRepository.existsByStudentIdAndLessonId(student.getId(), lessonId)) {
            lessonProgressRepository.save(LessonProgress.builder()
                    .student(student)
                    .lesson(lesson)
                    .build());
        }
    }

    /**
     * Loads a course by id or fails with a not-found API error.
     */
    public Course getCourse(Long id) {
        return courseRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Course not found"));
    }

    /**
     * Loads a learning module by id or fails with a not-found API error.
     */
    public LearningModule getModule(Long id) {
        return learningModuleRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Module not found"));
    }

    /**
     * Ensures only active trainers can create or modify training content.
     */
    private void ensureTrainer(User user) {
        if (user.getRole() != Role.TRAINER) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only trainers can perform this action");
        }
        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Trainer account is not active");
        }
    }

    /**
     * Applies course visibility rules for admins, owners, and published course viewers.
     */
    private void ensureCourseVisibleToRequester(User requester, Course course) {
        if (requester.getRole() == Role.ADMIN) {
            return;
        }
        if (requester.getRole() == Role.TRAINER && course.getCreatedBy().getId().equals(requester.getId())) {
            return;
        }
        if (course.getApprovalStatus() == CourseApprovalStatus.APPROVED) {
            return;
        }
        throw new ApiException(HttpStatus.FORBIDDEN, "Course outline is not accessible");
    }

    /**
     * Maps a course entity to the standard API response DTO.
     */
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

    /**
     * Normalizes and validates lesson content fields according to the declared lesson type.
     */
    private void validateLessonContent(LessonCreateRequest request) {
        String text = normalize(request.getTextContent());
        String image = normalize(request.getImageUrl());
        String video = normalize(request.getVideoUrl());

        switch (request.getContentType()) {
            case TEXT -> {
                if (text == null) {
                    throw new ApiException(HttpStatus.BAD_REQUEST, "Text content is required for TEXT lessons");
                }
                request.setTextContent(text);
                request.setImageUrl(null);
                request.setVideoUrl(null);
            }
            case IMAGE -> {
                if (image == null) {
                    throw new ApiException(HttpStatus.BAD_REQUEST, "Image URL is required for IMAGE lessons");
                }
                request.setTextContent(null);
                request.setImageUrl(image);
                request.setVideoUrl(null);
            }
            case VIDEO -> {
                if (video == null) {
                    throw new ApiException(HttpStatus.BAD_REQUEST, "Video URL is required for VIDEO lessons");
                }
                request.setTextContent(null);
                request.setImageUrl(null);
                request.setVideoUrl(video);
            }
            case TEXT_IMAGE -> {
                if (text == null || image == null) {
                    throw new ApiException(HttpStatus.BAD_REQUEST, "Both text content and image URL are required for TEXT_IMAGE lessons");
                }
                request.setTextContent(text);
                request.setImageUrl(image);
                request.setVideoUrl(null);
            }
            default -> throw new ApiException(HttpStatus.BAD_REQUEST, "Unsupported lesson content type");
        }
    }

    /**
     * Trims string values and converts blank inputs to null.
     */
    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
