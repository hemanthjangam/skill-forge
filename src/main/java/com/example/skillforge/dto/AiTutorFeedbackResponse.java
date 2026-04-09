package com.example.skillforge.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.extern.jackson.Jacksonized;

import java.util.List;

@Getter
@Builder
@Jacksonized
public class AiTutorFeedbackResponse {
    private String verdict;
    private List<String> strengths;
    private List<String> improvements;
    private String revisedAnswerHint;
    private String nextStep;
}
