package com.example.skillforge.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class CourseOutlineModuleResponse {
    private Long id;
    private String title;
    private long questionCount;
    private List<CourseOutlineLessonResponse> lessons;
}
