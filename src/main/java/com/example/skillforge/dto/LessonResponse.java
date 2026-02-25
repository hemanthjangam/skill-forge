package com.example.skillforge.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class LessonResponse {
    private Long id;
    private String title;
    private String content;
    private Long moduleId;
}
