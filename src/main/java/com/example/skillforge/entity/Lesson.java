package com.example.skillforge.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Lesson {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LessonContentType contentType;

    @Column(name = "content", length = 5000)
    private String textContent;

    @Column(length = 1000)
    private String imageUrl;

    @Column(length = 1000)
    private String videoUrl;

    @ManyToOne(optional = false)
    @JoinColumn(name = "module_id")
    private LearningModule module;

    @PrePersist
    public void prePersist() {
        if (contentType == null) {
            contentType = LessonContentType.TEXT;
        }
    }
}
