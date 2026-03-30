package com.example.skillforge.repository;

import com.example.skillforge.entity.Course;
import com.example.skillforge.entity.CourseCertificate;
import com.example.skillforge.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CourseCertificateRepository extends JpaRepository<CourseCertificate, Long> {
    List<CourseCertificate> findByStudentOrderByIssuedAtDesc(User student);
    Optional<CourseCertificate> findByStudentAndCourse(User student, Course course);
}
