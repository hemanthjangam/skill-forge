package com.example.skillforge.service;

import com.example.skillforge.config.AiProperties;
import com.example.skillforge.dto.AiChatMessageRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class DefaultAiGenerationService implements AiGenerationService {

    private final AiProperties aiProperties;
    private final GeminiClientService geminiClientService;
    private final OllamaClientService ollamaClientService;

    @Override
    public <T> T generateStructuredJson(String systemInstruction,
            List<AiChatMessageRequest> messages,
            Class<T> responseType,
            AiTaskProfile taskProfile) {
        String provider = aiProperties.getProvider() == null
                ? "gemini"
                : aiProperties.getProvider().trim().toLowerCase(Locale.ROOT);
        if ("ollama".equals(provider)) {
            return ollamaClientService.generateStructuredJson(systemInstruction, messages, responseType, taskProfile);
        }
        return geminiClientService.generateStructuredJson(systemInstruction, messages, responseType);
    }
}
