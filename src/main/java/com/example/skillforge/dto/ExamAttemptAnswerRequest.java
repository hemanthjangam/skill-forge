package com.example.skillforge.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ExamAttemptAnswerRequest {
    @NotNull
    private Long questionId;

    @NotBlank
    private String selectedAnswer;
}
