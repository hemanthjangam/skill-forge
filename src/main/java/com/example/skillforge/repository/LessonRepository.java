package com.example.skillforge.repository;

import com.example.skillforge.entity.LearningModule;
import com.example.skillforge.entity.Lesson;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LessonRepository extends JpaRepository<Lesson, Long> {
    List<Lesson> findByModule(LearningModule module);
}
