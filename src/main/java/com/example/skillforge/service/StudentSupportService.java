package com.example.skillforge.service;

import com.example.skillforge.dto.AchievementBadgeResponse;
import com.example.skillforge.dto.CourseCertificateResponse;
import com.example.skillforge.dto.CourseRecommendationResponse;
import com.example.skillforge.dto.DoubtCreateRequest;
import com.example.skillforge.dto.DoubtResolveRequest;
import com.example.skillforge.dto.DoubtResponse;
import com.example.skillforge.dto.StudentSupportSummaryResponse;
import com.example.skillforge.entity.AchievementBadge;
import com.example.skillforge.entity.AchievementBadgeCode;
import com.example.skillforge.entity.Course;
import com.example.skillforge.entity.CourseApprovalStatus;
import com.example.skillforge.entity.CourseCertificate;
import com.example.skillforge.entity.DoubtStatus;
import com.example.skillforge.entity.Enrollment;
import com.example.skillforge.entity.LearningModule;
import com.example.skillforge.entity.Role;
import com.example.skillforge.entity.StudentDoubt;
import com.example.skillforge.entity.User;
import com.example.skillforge.entity.UserSkillLevel;
import com.example.skillforge.exception.ApiException;
import com.example.skillforge.repository.AchievementBadgeRepository;
import com.example.skillforge.repository.CourseCertificateRepository;
import com.example.skillforge.repository.CourseExamAttemptRepository;
import com.example.skillforge.repository.CourseRepository;
import com.example.skillforge.repository.EnrollmentRepository;
import com.example.skillforge.repository.LearningModuleRepository;
import com.example.skillforge.repository.LessonProgressRepository;
import com.example.skillforge.repository.QuestionRepository;
import com.example.skillforge.repository.QuizAttemptRepository;
import com.example.skillforge.repository.StudentDoubtRepository;
import com.example.skillforge.repository.UserSkillLevelRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class StudentSupportService {

    private final CourseService courseService;
    private final StudentDoubtRepository studentDoubtRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final LearningModuleRepository learningModuleRepository;
    private final NotificationService notificationService;
    private final AchievementBadgeRepository achievementBadgeRepository;
    private final CourseCertificateRepository courseCertificateRepository;
    private final CourseRepository courseRepository;
    private final LessonProgressRepository lessonProgressRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final CourseExamAttemptRepository courseExamAttemptRepository;
    private final LeaderboardService leaderboardService;
    private final QuestionRepository questionRepository;
    private final UserSkillLevelRepository userSkillLevelRepository;

    @Transactional
    public DoubtResponse createDoubt(User student, DoubtCreateRequest request) {
        ensureStudent(student);

        Course course = request.getCourseId() == null ? null : courseService.getCourse(request.getCourseId());
        LearningModule module = request.getModuleId() == null ? null : courseService.getModule(request.getModuleId());

        if (module != null) {
            course = module.getCourse();
        }
        if (course != null && !enrollmentRepository.existsByStudentAndCourse(student, course)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Student must be enrolled before raising a course doubt");
        }

        StudentDoubt doubt = studentDoubtRepository.save(StudentDoubt.builder()
                .student(student)
                .course(course)
                .module(module)
                .concept(request.getConcept().trim())
                .question(request.getQuestion().trim())
                .status(DoubtStatus.OPEN)
                .build());

        if (course != null) {
            notificationService.createNotification(course.getCreatedBy(),
                    student.getName() + " raised a doubt in '" + course.getTitle() + "'");
        }
        return toDoubtResponse(doubt);
    }

    public List<DoubtResponse> getStudentDoubts(User student) {
        ensureStudent(student);
        return studentDoubtRepository.findByStudentOrderByCreatedAtDesc(student).stream()
                .map(this::toDoubtResponse)
                .toList();
    }

    public List<DoubtResponse> getOpenDoubts(User reviewer) {
        List<StudentDoubt> doubts;
        if (reviewer.getRole() == Role.ADMIN) {
            doubts = studentDoubtRepository.findByStatusOrderByCreatedAtAsc(DoubtStatus.OPEN);
        } else if (reviewer.getRole() == Role.TRAINER) {
            doubts = studentDoubtRepository.findByCourseCreatedByAndStatusOrderByCreatedAtAsc(reviewer, DoubtStatus.OPEN);
        } else {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only trainers or admins can review doubts");
        }
        return doubts.stream().map(this::toDoubtResponse).toList();
    }

    @Transactional
    public DoubtResponse resolveDoubt(User reviewer, Long doubtId, DoubtResolveRequest request) {
        StudentDoubt doubt = studentDoubtRepository.findById(doubtId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Doubt not found"));

        if (reviewer.getRole() == Role.TRAINER) {
            if (doubt.getCourse() == null || !doubt.getCourse().getCreatedBy().getId().equals(reviewer.getId())) {
                throw new ApiException(HttpStatus.FORBIDDEN, "Trainer cannot resolve this doubt");
            }
        } else if (reviewer.getRole() != Role.ADMIN) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only trainers or admins can resolve doubts");
        }

        doubt.setStatus(DoubtStatus.RESOLVED);
        doubt.setResolution(request.getResolution().trim());
        doubt.setResolvedBy(reviewer);
        doubt.setResolvedAt(java.time.LocalDateTime.now());
        StudentDoubt saved = studentDoubtRepository.save(doubt);

        notificationService.createNotification(saved.getStudent(),
                "Your doubt on '" + saved.getConcept() + "' has been resolved");
        return toDoubtResponse(saved);
    }

    @Transactional
    public void synchronizeStudentArtifacts(User student) {
        ensureStudent(student);
        issueCertificates(student);
        awardBadge(student, AchievementBadgeCode.SEVEN_DAY_STREAK,
                leaderboardService.getStreakSummary(student).getCurrentStreak() >= 7,
                "7-Day Streak",
                "Maintained learning consistency for seven consecutive knowledge-check days.");
        awardBadge(student, AchievementBadgeCode.QUICK_LEARNER,
                quizAttemptRepository.averageScoreByStudent(student) >= 85 && quizAttemptRepository.countByStudent(student) >= 3,
                "Quick Learner",
                "Maintained excellent quiz performance across repeated practice.");
        awardBadge(student, AchievementBadgeCode.QUIZ_MASTER,
                quizAttemptRepository.countByStudentAndScorePercentageGreaterThanEqual(student, 90) >= 3
                        || courseExamAttemptRepository.countByStudentAndScorePercentageGreaterThanEqual(student, 90) >= 2,
                "Quiz Master",
                "Repeatedly achieved high scores in graded knowledge checks and exams.");
        awardBadge(student, AchievementBadgeCode.NIGHT_OWL,
                quizAttemptRepository.hasNightOwlAttempt(student) || courseExamAttemptRepository.hasNightOwlAttempt(student),
                "Night Owl",
                "Completed assessed learning activity during late-night study hours.");
    }

    public StudentSupportSummaryResponse getStudentSummary(User student) {
        synchronizeStudentArtifacts(student);

        return StudentSupportSummaryResponse.builder()
                .openDoubts(studentDoubtRepository.countByStudentAndStatus(student, DoubtStatus.OPEN))
                .examsTaken(courseExamAttemptRepository.countByStudent(student))
                .badges(achievementBadgeRepository.findByStudentOrderByAwardedAtDesc(student).stream().map(this::toBadgeResponse).toList())
                .certificates(courseCertificateRepository.findByStudentOrderByIssuedAtDesc(student).stream().map(this::toCertificateResponse).toList())
                .recommendations(buildRecommendations(student))
                .recentDoubts(getStudentDoubts(student).stream().limit(5).toList())
                .build();
    }

    private void issueCertificates(User student) {
        for (Enrollment enrollment : enrollmentRepository.findByStudent(student)) {
            Course course = enrollment.getCourse();
            long completedLessons = lessonProgressRepository.countByStudentIdAndLessonModuleCourseId(student.getId(), course.getId());
            long totalLessons = learningModuleRepository.findByCourseOrderByIdAsc(course).stream()
                    .mapToLong(module -> module.getLessons().size())
                    .sum();
            if (totalLessons == 0 || completedLessons < totalLessons) {
                continue;
            }
            if (courseCertificateRepository.findByStudentAndCourse(student, course).isPresent()) {
                continue;
            }
            courseCertificateRepository.save(CourseCertificate.builder()
                    .student(student)
                    .course(course)
                    .certificateCode("SF-" + course.getId() + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT))
                    .build());
            notificationService.createNotification(student,
                    "Certificate issued for completing '" + course.getTitle() + "'");
        }
    }

    private void awardBadge(User student, AchievementBadgeCode code, boolean shouldAward, String title, String description) {
        if (!shouldAward || achievementBadgeRepository.findByStudentAndBadgeCode(student, code).isPresent()) {
            return;
        }
        achievementBadgeRepository.save(AchievementBadge.builder()
                .student(student)
                .badgeCode(code)
                .title(title)
                .description(description)
                .build());
        notificationService.createNotification(student, "Badge unlocked: " + title);
    }

    private List<CourseRecommendationResponse> buildRecommendations(User student) {
        List<Enrollment> enrollments = enrollmentRepository.findByStudent(student);
        List<Long> enrolledCourseIds = enrollments.stream().map(item -> item.getCourse().getId()).toList();
        List<String> weakConcepts = userSkillLevelRepository.findByUser(student).stream()
                .sorted(Comparator.comparingDouble(UserSkillLevel::getScore))
                .limit(3)
                .map(item -> item.getSkill().getName().trim().toLowerCase(Locale.ROOT))
                .toList();

        List<CourseRecommendationResponse> recommendations = new ArrayList<>();
        for (Course candidate : courseRepository.findByApprovalStatusOrderByCreatedAtDesc(CourseApprovalStatus.APPROVED)) {
            if (enrolledCourseIds.contains(candidate.getId())) {
                continue;
            }
            List<String> concepts = questionRepository.findByModuleCourseId(candidate.getId()).stream()
                    .map(question -> question.getConcept().trim().toLowerCase(Locale.ROOT))
                    .distinct()
                    .toList();
            long overlap = concepts.stream().filter(weakConcepts::contains).count();
            double score = weakConcepts.isEmpty() ? 50 : Math.min(98, 55 + overlap * 15 + concepts.size() * 0.2);
            String rationale = overlap > 0
                    ? "Matches your weaker concepts: " + String.join(", ", concepts.stream().filter(weakConcepts::contains).toList())
                    : "Broadens your current track with adjacent project practice.";
            recommendations.add(CourseRecommendationResponse.builder()
                    .courseId(candidate.getId())
                    .courseTitle(candidate.getTitle())
                    .rationale(rationale)
                    .matchScore(score)
                    .build());
        }

        return recommendations.stream()
                .sorted(Comparator.comparingDouble(CourseRecommendationResponse::getMatchScore).reversed())
                .limit(4)
                .toList();
    }

    private DoubtResponse toDoubtResponse(StudentDoubt doubt) {
        return DoubtResponse.builder()
                .id(doubt.getId())
                .studentId(doubt.getStudent().getId())
                .studentName(doubt.getStudent().getName())
                .courseId(doubt.getCourse() == null ? null : doubt.getCourse().getId())
                .courseTitle(doubt.getCourse() == null ? null : doubt.getCourse().getTitle())
                .moduleId(doubt.getModule() == null ? null : doubt.getModule().getId())
                .moduleTitle(doubt.getModule() == null ? null : doubt.getModule().getTitle())
                .concept(doubt.getConcept())
                .question(doubt.getQuestion())
                .status(doubt.getStatus())
                .resolution(doubt.getResolution())
                .resolvedByName(doubt.getResolvedBy() == null ? null : doubt.getResolvedBy().getName())
                .createdAt(doubt.getCreatedAt())
                .resolvedAt(doubt.getResolvedAt())
                .build();
    }

    private AchievementBadgeResponse toBadgeResponse(AchievementBadge badge) {
        return AchievementBadgeResponse.builder()
                .badgeCode(badge.getBadgeCode())
                .title(badge.getTitle())
                .description(badge.getDescription())
                .awardedAt(badge.getAwardedAt())
                .build();
    }

    private CourseCertificateResponse toCertificateResponse(CourseCertificate certificate) {
        return CourseCertificateResponse.builder()
                .courseId(certificate.getCourse().getId())
                .courseTitle(certificate.getCourse().getTitle())
                .certificateCode(certificate.getCertificateCode())
                .issuedAt(certificate.getIssuedAt())
                .build();
    }

    private void ensureStudent(User user) {
        if (user.getRole() != Role.STUDENT) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only students can access this workflow");
        }
    }
}
