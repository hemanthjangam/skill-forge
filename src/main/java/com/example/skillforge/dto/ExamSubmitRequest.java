package com.example.skillforge.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class ExamSubmitRequest {
    @Valid
    @NotEmpty
    private List<ExamAttemptAnswerRequest> answers;
}
