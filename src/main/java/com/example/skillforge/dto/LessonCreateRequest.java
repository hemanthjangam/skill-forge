package com.example.skillforge.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LessonCreateRequest {
    @NotBlank
    private String title;

    @NotBlank
    @Size(max = 5000)
    private String content;
}
