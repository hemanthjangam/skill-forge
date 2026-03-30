package com.example.skillforge.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ExamGenerateRequest {
    private String title;
    private String description;

    @Min(5)
    @Max(25)
    private Integer questionCount = 10;

    @Min(10)
    @Max(180)
    private Integer durationMinutes = 45;
}
