package com.example.skillforge.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class QuestionForQuizResponse {
    private Long id;
    private String statement;
    private String concept;
    private List<String> options;
}
