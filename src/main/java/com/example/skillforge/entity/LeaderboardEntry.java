package com.example.skillforge.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(uniqueConstraints = @UniqueConstraint(columnNames = "user_id"))
public class LeaderboardEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(optional = false)
    @JoinColumn(name = "user_id", unique = true)
    private User user;

    @Column(nullable = false)
    private Integer points;

    @Column(nullable = false)
    private Integer currentStreak;

    @Column(nullable = false)
    private Integer bestStreak;

    private LocalDate lastActiveDate;

    @Column(nullable = false)
    private Integer totalKnowledgeChecks;

    @PrePersist
    public void prePersist() {
        if (points == null) {
            points = 0;
        }
        if (currentStreak == null) {
            currentStreak = 0;
        }
        if (bestStreak == null) {
            bestStreak = 0;
        }
        if (totalKnowledgeChecks == null) {
            totalKnowledgeChecks = 0;
        }
    }
}
