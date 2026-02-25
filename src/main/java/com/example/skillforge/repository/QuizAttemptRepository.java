package com.example.skillforge.repository;

import com.example.skillforge.entity.LearningModule;
import com.example.skillforge.entity.QuizAttempt;
import com.example.skillforge.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, Long> {
    Page<QuizAttempt> findByStudent(User student, Pageable pageable);
    Page<QuizAttempt> findByStudentAndModuleOrderByAttemptedAtDesc(User student, LearningModule module, Pageable pageable);
    long countByStudent(User student);

    long countByModuleCourseCreatedBy(User trainer);

    @Query("select coalesce(avg(q.scorePercentage), 0) from QuizAttempt q where q.student = :student")
    Double averageScoreByStudent(User student);
}
