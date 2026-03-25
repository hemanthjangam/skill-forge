package com.example.skillforge.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class AiTutorTeachResponse {
    private String concept;
    private String courseTitle;
    private String moduleTitle;
    private String summary;
    private String intuition;
    private String projectApplication;
    private List<String> practiceSteps;
    private List<String> commonMistakes;
    private List<String> quickChecks;
    private String nextStep;
}
