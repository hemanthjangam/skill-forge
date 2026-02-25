package com.example.skillforge.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Question {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "module_id")
    private LearningModule module;

    @Column(nullable = false, length = 1000)
    private String statement;

    @Column(nullable = false)
    private String topic;

    @Column(nullable = false)
    private String concept;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Difficulty difficulty;

    @ElementCollection
    @CollectionTable(name = "question_options", joinColumns = @JoinColumn(name = "question_id"))
    @Column(name = "option_value")
    @Builder.Default
    private List<String> options = new ArrayList<>();

    @Column(nullable = false)
    private String correctAnswer;
}
