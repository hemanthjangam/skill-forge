package com.example.skillforge.repository;

import com.example.skillforge.entity.Course;
import com.example.skillforge.entity.CourseExam;
import com.example.skillforge.entity.CourseExamStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CourseExamRepository extends JpaRepository<CourseExam, Long> {
    List<CourseExam> findByCourseAndStatusOrderByCreatedAtDesc(Course course, CourseExamStatus status);
    List<CourseExam> findByCourseCreatedByOrderByCreatedAtDesc(com.example.skillforge.entity.User trainer);
}
