package com.example.skillforge.service;

import com.example.skillforge.dto.AdminDashboardResponse;
import com.example.skillforge.dto.StudentActivityPointResponse;
import com.example.skillforge.dto.StudentDashboardResponse;
import com.example.skillforge.dto.StreakSummaryResponse;
import com.example.skillforge.dto.TrainerDashboardResponse;
import com.example.skillforge.entity.CourseApprovalStatus;
import com.example.skillforge.entity.User;
import com.example.skillforge.entity.UserStatus;
import com.example.skillforge.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.sql.Date;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final EnrollmentRepository enrollmentRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final NotificationRepository notificationRepository;
    private final CourseRepository courseRepository;
    private final QuestionRepository questionRepository;
    private final TrainerProfileRepository trainerProfileRepository;
    private final UserRepository userRepository;
    private final LeaderboardService leaderboardService;

    /**
     * Aggregates the metrics displayed on the student dashboard.
     */
    public StudentDashboardResponse studentSummary(User student) {
        StreakSummaryResponse streak = leaderboardService.getStreakSummary(student);
        return StudentDashboardResponse.builder()
                .enrolledCourses(enrollmentRepository.findByStudent(student).size())
                .quizAttempts(quizAttemptRepository.countByStudent(student))
                .averageQuizScore(quizAttemptRepository.averageScoreByStudent(student))
                .unreadNotifications(notificationRepository.countByUserAndReadIsFalse(student))
                .currentStreak(streak.getCurrentStreak())
                .bestStreak(streak.getBestStreak())
                .knowledgeChecksCompleted(streak.getTotalKnowledgeChecks())
                .totalPoints(streak.getPoints())
                .build();
    }

    /**
     * Returns day-wise student activity points for charts and streak visualizations.
     */
    public List<StudentActivityPointResponse> studentActivity(User student, int days) {
        int sanitizedDays = Math.max(7, Math.min(days, 365));
        LocalDateTime from = LocalDate.now().minusDays(sanitizedDays - 1L).atStartOfDay();

        return quizAttemptRepository.findDailyActivityByStudentSince(student, from).stream()
                .map(row -> StudentActivityPointResponse.builder()
                        .date(extractDate(row[0]))
                        .knowledgeChecks(((Number) row[1]).longValue())
                        .averageScore(((Number) row[2]).doubleValue())
                        .build())
                .toList();
    }

    /**
     * Aggregates the metrics displayed on the trainer dashboard.
     */
    public TrainerDashboardResponse trainerSummary(User trainer) {
        return TrainerDashboardResponse.builder()
                .createdCourses(courseRepository.countByCreatedBy(trainer))
                .pendingCourseApprovals(courseRepository.findByCreatedBy(trainer, org.springframework.data.domain.Pageable.unpaged())
                        .stream()
                        .filter(c -> c.getApprovalStatus() == CourseApprovalStatus.PENDING)
                        .count())
                .totalEnrollments(enrollmentRepository.countByCourseCreatedBy(trainer))
                .questionsCreated(questionRepository.countByTrainer(trainer))
                .quizAttemptsOnTrainerModules(quizAttemptRepository.countByModuleCourseCreatedBy(trainer))
                .build();
    }

    /**
     * Aggregates the metrics displayed on the admin dashboard.
     */
    public AdminDashboardResponse adminSummary() {
        return AdminDashboardResponse.builder()
                .totalUsers(userRepository.count())
                .activeUsers(userRepository.countByStatus(UserStatus.ACTIVE))
                .inactiveUsers(userRepository.countByStatus(UserStatus.INACTIVE))
                .pendingTrainerApprovals(trainerProfileRepository.countByApproved(false))
                .pendingCourseApprovals(courseRepository.countByApprovalStatus(CourseApprovalStatus.PENDING))
                .approvedCourses(courseRepository.countByApprovalStatus(CourseApprovalStatus.APPROVED))
                .build();
    }

    /**
     * Converts native query date projections into a LocalDate instance.
     */
    private LocalDate extractDate(Object value) {
        if (value instanceof LocalDate localDate) {
            return localDate;
        }
        if (value instanceof Date date) {
            return date.toLocalDate();
        }
        return LocalDate.parse(String.valueOf(value));
    }
}
