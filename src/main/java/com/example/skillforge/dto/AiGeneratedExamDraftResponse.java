package com.example.skillforge.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.extern.jackson.Jacksonized;

import java.util.List;

@Getter
@Builder
@Jacksonized
public class AiGeneratedExamDraftResponse {
    private String title;
    private String description;
    private List<AiGeneratedExamQuestionResponse> questions;
}
