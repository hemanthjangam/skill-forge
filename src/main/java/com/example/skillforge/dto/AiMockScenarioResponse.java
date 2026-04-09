package com.example.skillforge.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.extern.jackson.Jacksonized;

import java.util.List;

@Getter
@Builder
@Jacksonized
public class AiMockScenarioResponse {
    private Long courseId;
    private String courseTitle;
    private String scenarioTitle;
    private String scenarioBrief;
    private String learnerGoal;
    private String deliverable;
    private List<String> focusConcepts;
    private List<String> taskChecklist;
    private List<String> constraints;
    private List<String> evaluationFocus;
}
