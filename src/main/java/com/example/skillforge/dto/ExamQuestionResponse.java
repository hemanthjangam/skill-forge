package com.example.skillforge.dto;

import com.example.skillforge.entity.Difficulty;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class ExamQuestionResponse {
    private Long id;
    private String statement;
    private String concept;
    private Difficulty difficulty;
    private List<String> options;
    private String explanation;
    private String selectedAnswer;
    private String correctAnswer;
    private boolean correct;
}
