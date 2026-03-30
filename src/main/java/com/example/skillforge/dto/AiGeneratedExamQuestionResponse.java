package com.example.skillforge.dto;

import com.example.skillforge.entity.Difficulty;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class AiGeneratedExamQuestionResponse {
    private String statement;
    private String concept;
    private Difficulty difficulty;
    private List<String> options;
    private String correctAnswer;
    private String explanation;
    private Long moduleId;
}
