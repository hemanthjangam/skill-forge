package com.example.skillforge.repository;

import com.example.skillforge.entity.CourseExam;
import com.example.skillforge.entity.CourseExamAttempt;
import com.example.skillforge.entity.ExamAttemptStatus;
import com.example.skillforge.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CourseExamAttemptRepository extends JpaRepository<CourseExamAttempt, Long> {
    List<CourseExamAttempt> findByStudentOrderByStartedAtDesc(User student);
    Optional<CourseExamAttempt> findByExamAndStudentAndStatus(CourseExam exam, User student, ExamAttemptStatus status);
    long countByStudent(User student);
    long countByStudentAndScorePercentageGreaterThanEqual(User student, double minScore);

    @Query("""
            select case when count(a) > 0 then true else false end
            from CourseExamAttempt a
            where a.student = :student and (hour(a.startedAt) >= 22 or hour(a.startedAt) < 5)
            """)
    boolean hasNightOwlAttempt(@Param("student") User student);
}
