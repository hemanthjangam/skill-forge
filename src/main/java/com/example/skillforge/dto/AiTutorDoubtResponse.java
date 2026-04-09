package com.example.skillforge.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.extern.jackson.Jacksonized;

import java.util.List;

@Getter
@Builder
@Jacksonized
public class AiTutorDoubtResponse {
    private String answer;
    private List<String> keyPoints;
    private String followUpPrompt;
}
