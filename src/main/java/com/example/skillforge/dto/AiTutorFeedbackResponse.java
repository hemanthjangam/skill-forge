package com.example.skillforge.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class AiTutorFeedbackResponse {
    private String verdict;
    private List<String> strengths;
    private List<String> improvements;
    private String revisedAnswerHint;
    private String nextStep;
}
