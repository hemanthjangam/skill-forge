package com.example.skillforge.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class AiMockScenarioResponse {
    private Long courseId;
    private String courseTitle;
    private List<String> focusConcepts;
    private List<String> prompts;
    private String evaluationFocus;
}
