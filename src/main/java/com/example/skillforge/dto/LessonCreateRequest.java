package com.example.skillforge.dto;

import com.example.skillforge.entity.LessonContentType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LessonCreateRequest {
    @NotBlank
    private String title;

    @NotNull
    private LessonContentType contentType;

    private String textContent;
    private String imageUrl;
    private String videoUrl;
}
