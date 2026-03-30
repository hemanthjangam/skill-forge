package com.example.skillforge.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseExamAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "exam_id")
    private CourseExam exam;

    @ManyToOne(optional = false)
    @JoinColumn(name = "student_id")
    private User student;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ExamAttemptStatus status;

    @Column(nullable = false)
    private LocalDateTime startedAt;

    private LocalDateTime submittedAt;

    @Column(nullable = false)
    private Integer totalQuestions;

    @Column(nullable = false)
    private Integer correctAnswers;

    @Column(nullable = false)
    private Double scorePercentage;

    @Column(nullable = false)
    private Double proctoringScore;

    @Column(nullable = false)
    private Integer violationCount;

    @OneToMany(mappedBy = "examAttempt", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<CourseExamAttemptAnswer> answers = new ArrayList<>();

    @OneToMany(mappedBy = "examAttempt", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ExamProctorEvent> proctorEvents = new ArrayList<>();

    @PrePersist
    public void prePersist() {
        startedAt = LocalDateTime.now();
        if (status == null) {
            status = ExamAttemptStatus.IN_PROGRESS;
        }
        if (totalQuestions == null) {
            totalQuestions = 0;
        }
        if (correctAnswers == null) {
            correctAnswers = 0;
        }
        if (scorePercentage == null) {
            scorePercentage = 0.0;
        }
        if (proctoringScore == null) {
            proctoringScore = 100.0;
        }
        if (violationCount == null) {
            violationCount = 0;
        }
    }
}
