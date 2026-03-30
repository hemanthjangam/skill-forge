package com.example.skillforge.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class AiGeneratedExamDraftResponse {
    private String title;
    private String description;
    private List<AiGeneratedExamQuestionResponse> questions;
}
