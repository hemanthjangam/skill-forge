package com.example.skillforge.repository;

import com.example.skillforge.entity.Course;
import com.example.skillforge.entity.LearningModule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LearningModuleRepository extends JpaRepository<LearningModule, Long> {
    List<LearningModule> findByCourse(Course course);
    List<LearningModule> findByCourseOrderByIdAsc(Course course);
}
