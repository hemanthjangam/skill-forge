package com.example.skillforge.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ModuleResponse {
    private Long id;
    private String title;
    private Long courseId;
}
