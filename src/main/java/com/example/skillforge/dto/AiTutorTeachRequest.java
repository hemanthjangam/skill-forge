package com.example.skillforge.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AiTutorTeachRequest {
    private Long courseId;
    private Long moduleId;

    @NotBlank
    private String concept;
}
