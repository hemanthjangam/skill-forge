package com.example.skillforge.dto;

import com.example.skillforge.entity.Difficulty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class QuestionCreateRequest {
    @NotBlank
    @Size(max = 1000)
    private String statement;

    @NotBlank
    private String topic;

    @NotBlank
    private String concept;

    @NotNull
    private Difficulty difficulty;

    @NotEmpty
    private List<String> options;

    @NotBlank
    private String correctAnswer;
}
