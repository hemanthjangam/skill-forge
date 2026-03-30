package com.example.skillforge.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DoubtCreateRequest {
    private Long courseId;
    private Long moduleId;

    @NotBlank
    private String concept;

    @NotBlank
    private String question;
}
