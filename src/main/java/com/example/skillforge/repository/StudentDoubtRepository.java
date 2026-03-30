package com.example.skillforge.repository;

import com.example.skillforge.entity.Course;
import com.example.skillforge.entity.DoubtStatus;
import com.example.skillforge.entity.StudentDoubt;
import com.example.skillforge.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StudentDoubtRepository extends JpaRepository<StudentDoubt, Long> {
    List<StudentDoubt> findByStudentOrderByCreatedAtDesc(User student);
    List<StudentDoubt> findByStatusOrderByCreatedAtAsc(DoubtStatus status);
    List<StudentDoubt> findByCourseCreatedByAndStatusOrderByCreatedAtAsc(User trainer, DoubtStatus status);
    long countByStudentAndStatus(User student, DoubtStatus status);
    long countByCourseAndStatus(Course course, DoubtStatus status);
}
