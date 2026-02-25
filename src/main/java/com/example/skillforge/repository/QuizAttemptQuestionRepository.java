package com.example.skillforge.repository;

import com.example.skillforge.entity.QuizAttemptQuestion;
import org.springframework.data.jpa.repository.JpaRepository;

public interface QuizAttemptQuestionRepository extends JpaRepository<QuizAttemptQuestion, Long> {
}
