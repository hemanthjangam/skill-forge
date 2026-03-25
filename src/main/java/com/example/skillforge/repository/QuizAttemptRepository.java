package com.example.skillforge.repository;

import com.example.skillforge.entity.LearningModule;
import com.example.skillforge.entity.QuizAttempt;
import com.example.skillforge.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, Long> {
    Page<QuizAttempt> findByStudent(User student, Pageable pageable);
    Page<QuizAttempt> findByStudentAndModuleOrderByAttemptedAtDesc(User student, LearningModule module, Pageable pageable);
    boolean existsByStudentAndAttemptedAtAfter(User student, LocalDateTime attemptedAt);
    long countByStudent(User student);
    void deleteByModuleIn(List<LearningModule> modules);

    long countByModuleCourseCreatedBy(User trainer);

    @Query("select coalesce(avg(q.scorePercentage), 0) from QuizAttempt q where q.student = :student")
    Double averageScoreByStudent(User student);

    @Query("""
            select function('date', q.attemptedAt), count(q), coalesce(avg(q.scorePercentage), 0)
            from QuizAttempt q
            where q.student = :student and q.attemptedAt >= :from
            group by function('date', q.attemptedAt)
            order by function('date', q.attemptedAt)
            """)
    List<Object[]> findDailyActivityByStudentSince(@Param("student") User student, @Param("from") LocalDateTime from);
}
