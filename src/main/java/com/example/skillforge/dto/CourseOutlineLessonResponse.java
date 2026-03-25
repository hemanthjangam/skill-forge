package com.example.skillforge.dto;

import com.example.skillforge.entity.LessonContentType;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class CourseOutlineLessonResponse {
    private Long id;
    private String title;
    private LessonContentType contentType;
    private String textContent;
    private String imageUrl;
    private String videoUrl;

    @JsonProperty("isCompleted")
    private boolean isCompleted;
}
