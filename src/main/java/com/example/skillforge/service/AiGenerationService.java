package com.example.skillforge.service;

import com.example.skillforge.dto.AiChatMessageRequest;

import java.util.List;

public interface AiGenerationService {
    <T> T generateStructuredJson(String systemInstruction,
            List<AiChatMessageRequest> messages,
            Class<T> responseType,
            AiTaskProfile taskProfile);
}
