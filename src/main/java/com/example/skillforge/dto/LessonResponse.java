package com.example.skillforge.dto;

import com.example.skillforge.entity.LessonContentType;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class LessonResponse {
    private Long id;
    private String title;
    private LessonContentType contentType;
    private String textContent;
    private String imageUrl;
    private String videoUrl;
    private Long moduleId;
}
