package com.example.skillforge.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class QuizRoundResponse {
    private boolean completed;
    private int totalAnsweredQuestions;
    private int currentRoundTotalQuestions;
    private int currentRoundCorrectAnswers;
    private List<String> weakConcepts;
    private List<QuestionForQuizResponse> nextQuestions;
    private QuizSubmitResponse result;
}
