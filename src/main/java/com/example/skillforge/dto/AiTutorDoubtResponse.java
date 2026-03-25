package com.example.skillforge.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class AiTutorDoubtResponse {
    private String answer;
    private List<String> keyPoints;
    private String followUpPrompt;
}
