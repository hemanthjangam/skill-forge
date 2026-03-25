package com.example.skillforge.repository;

import com.example.skillforge.entity.LessonProgress;
import com.example.skillforge.entity.Lesson;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface LessonProgressRepository extends JpaRepository<LessonProgress, Long> {
    
    boolean existsByStudentIdAndLessonId(Long studentId, Long lessonId);
    void deleteByLessonIn(List<Lesson> lessons);

    @Query("SELECT lp.lesson.id FROM LessonProgress lp WHERE lp.student.id = :studentId AND lp.lesson.module.course.id = :courseId")
    List<Long> findCompletedLessonIdsByStudentAndCourse(@Param("studentId") Long studentId, @Param("courseId") Long courseId);
}
