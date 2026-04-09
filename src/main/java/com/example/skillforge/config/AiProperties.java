package com.example.skillforge.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Stores runtime configuration for pluggable AI providers.
 */
@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app.ai")
public class AiProperties {
    private String provider = "gemini";
    private Gemini gemini = new Gemini();
    private Ollama ollama = new Ollama();

    @Getter
    @Setter
    public static class Gemini {
        private String baseUrl;
        private String apiKey;
        private String model;
        private int timeoutMs = 30000;
    }

    @Getter
    @Setter
    public static class Ollama {
        private String baseUrl = "http://localhost:11434";
        private String model = "qwen2.5:14b";
        private String tutorModel = "qwen2.5:14b";
        private String generationModel = "qwen2.5:14b";
        private int timeoutMs = 120000;
    }
}
