package com.example.skillforge.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Stores runtime configuration for the Gemini-backed AI tutor integration.
 */
@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app.ai.gemini")
public class AiProperties {
    private String baseUrl;
    private String apiKey;
    private String model;
    private int timeoutMs = 30000;
}
