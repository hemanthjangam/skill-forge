package com.example.skillforge.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class AiMockGenerateResponse {
    private List<AiMockScenarioResponse> mocks;
}
