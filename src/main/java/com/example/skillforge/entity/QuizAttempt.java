package com.example.skillforge.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "student_id")
    private User student;

    @ManyToOne(optional = false)
    @JoinColumn(name = "module_id")
    private LearningModule module;

    @Column(nullable = false)
    private Integer totalQuestions;

    @Column(nullable = false)
    private Integer correctAnswers;

    @Column(nullable = false)
    private Double scorePercentage;

    @Column(nullable = false)
    private LocalDateTime attemptedAt;

    @OneToMany(mappedBy = "quizAttempt", cascade = CascadeType.ALL)
    @Builder.Default
    private List<QuizAttemptQuestion> answeredQuestions = new ArrayList<>();

    @PrePersist
    public void prePersist() {
        this.attemptedAt = LocalDateTime.now();
    }
}
