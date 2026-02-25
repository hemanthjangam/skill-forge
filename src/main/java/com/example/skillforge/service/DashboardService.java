package com.example.skillforge.service;

import com.example.skillforge.dto.AdminDashboardResponse;
import com.example.skillforge.dto.StudentDashboardResponse;
import com.example.skillforge.dto.TrainerDashboardResponse;
import com.example.skillforge.entity.CourseApprovalStatus;
import com.example.skillforge.entity.Role;
import com.example.skillforge.entity.User;
import com.example.skillforge.entity.UserStatus;
import com.example.skillforge.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

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

    public StudentDashboardResponse studentSummary(User student) {
        return StudentDashboardResponse.builder()
                .enrolledCourses(enrollmentRepository.findByStudent(student).size())
                .quizAttempts(quizAttemptRepository.countByStudent(student))
                .averageQuizScore(quizAttemptRepository.averageScoreByStudent(student))
                .unreadNotifications(notificationRepository.countByUserAndReadIsFalse(student))
                .build();
    }

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
}
