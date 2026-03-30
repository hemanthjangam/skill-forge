package com.example.skillforge.repository;

import com.example.skillforge.entity.CourseExamAttempt;
import com.example.skillforge.entity.ExamProctorEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ExamProctorEventRepository extends JpaRepository<ExamProctorEvent, Long> {
    List<ExamProctorEvent> findByExamAttemptOrderByCreatedAtAsc(CourseExamAttempt attempt);
}
