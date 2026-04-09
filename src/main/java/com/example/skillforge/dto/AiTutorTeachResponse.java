package com.example.skillforge.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.extern.jackson.Jacksonized;

import java.util.List;

@Getter
@Builder
@Jacksonized
public class AiTutorTeachResponse {
    private String concept;
    private String courseTitle;
    private String moduleTitle;
    private String summary;
    private String intuition;
    private List<String> projectApplication;
    private List<String> practiceSteps;
    private List<String> commonMistakes;
    private List<String> quickChecks;
    private String nextStep;
}
