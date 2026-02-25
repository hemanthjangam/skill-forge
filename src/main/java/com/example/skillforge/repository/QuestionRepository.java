package com.example.skillforge.repository;

import com.example.skillforge.entity.LearningModule;
import com.example.skillforge.entity.Question;
import com.example.skillforge.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface QuestionRepository extends JpaRepository<Question, Long> {
    long countByModule(LearningModule module);
    List<Question> findByModule(LearningModule module);

    @Query("select count(q) from Question q where q.module.course.createdBy = :trainer")
    long countByTrainer(User trainer);
}
