package com.example.skillforge.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class QuizSubmitRequest {
    @NotNull
    private Long moduleId;

    @Valid
    @NotEmpty
    private List<QuizAnswerRequest> answers;
}
