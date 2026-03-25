package com.example.skillforge.repository;

import com.example.skillforge.entity.Course;
import com.example.skillforge.entity.CourseApprovalStatus;
import com.example.skillforge.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CourseRepository extends JpaRepository<Course, Long> {
    Page<Course> findByApprovalStatus(CourseApprovalStatus status, Pageable pageable);
    Page<Course> findByCreatedBy(User trainer, Pageable pageable);
    List<Course> findByCreatedByOrderByCreatedAtDesc(User trainer);
    long countByCreatedBy(User trainer);
    long countByApprovalStatus(CourseApprovalStatus status);
}
