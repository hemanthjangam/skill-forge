package com.example.skillforge.service;

import com.example.skillforge.config.AiProperties;
import com.example.skillforge.dto.AiChatMessageRequest;
import com.example.skillforge.exception.ApiException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Encapsulates direct REST communication with the Gemini generateContent API.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class GeminiClientService {
    private static final Pattern RETRY_DELAY_PATTERN = Pattern.compile("\"retryDelay\"\\s*:\\s*\"(\\d+)s\"");

    private final AiProperties aiProperties;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newHttpClient();

    /**
     * Sends a structured JSON generation request to Gemini and maps the returned JSON payload.
     */
    public <T> T generateStructuredJson(String systemInstruction,
            List<AiChatMessageRequest> messages,
            Class<T> responseType) {
        ensureConfigured();

        try {
            String requestBody = objectMapper.writeValueAsString(buildRequestBody(systemInstruction, messages));
            HttpRequest request = HttpRequest.newBuilder(buildGenerateUri())
                    .timeout(Duration.ofMillis(aiProperties.getTimeoutMs()))
                    .header("Content-Type", "application/json")
                    .header("x-goog-api-key", aiProperties.getApiKey())
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 400) {
                log.warn("Gemini request failed with status {} and body {}", response.statusCode(), response.body());
                throw translateProviderError(response.statusCode(), response.body());
            }

            JsonNode root = objectMapper.readTree(response.body());
            String responseText = extractText(root);
            if (responseText == null || responseText.isBlank()) {
                throw new ApiException(HttpStatus.BAD_GATEWAY, "AI provider returned an empty response");
            }

            String sanitizedJson = sanitizeJson(responseText);
            return objectMapper.readValue(sanitizedJson, responseType);
        } catch (IOException e) {
            log.error("Failed to parse Gemini response", e);
            throw new ApiException(HttpStatus.BAD_GATEWAY, "AI provider returned an invalid response");
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new ApiException(HttpStatus.GATEWAY_TIMEOUT, "AI request was interrupted");
        }
    }

    /**
     * Converts provider-specific failures to clearer API responses for the frontend.
     */
    private ApiException translateProviderError(int statusCode, String responseBody) {
        if (statusCode == 429) {
            String retryDelay = extractRetryDelay(responseBody);
            String suffix = retryDelay == null ? "Please retry shortly." : "Please retry in about " + retryDelay + ".";
            return new ApiException(HttpStatus.TOO_MANY_REQUESTS,
                    "Gemini free-tier rate limit reached. " + suffix);
        }
        return new ApiException(HttpStatus.BAD_GATEWAY, "AI provider request failed");
    }

    /**
     * Extracts a retry delay from the Gemini error payload when present.
     */
    private String extractRetryDelay(String responseBody) {
        Matcher matcher = RETRY_DELAY_PATTERN.matcher(responseBody == null ? "" : responseBody);
        if (!matcher.find()) {
            return null;
        }
        return matcher.group(1) + " seconds";
    }

    /**
     * Validates that the Gemini API key was configured before runtime calls are attempted.
     */
    private void ensureConfigured() {
        String apiKey = aiProperties.getApiKey();
        if (apiKey == null || apiKey.isBlank() || apiKey.contains("YOUR_GEMINI_API_KEY")) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "Gemini API key is not configured");
        }
    }

    /**
     * Builds the Gemini generateContent endpoint URI from the configured model.
     */
    private URI buildGenerateUri() {
        String baseUrl = aiProperties.getBaseUrl().endsWith("/")
                ? aiProperties.getBaseUrl().substring(0, aiProperties.getBaseUrl().length() - 1)
                : aiProperties.getBaseUrl();
        return URI.create(baseUrl + "/v1beta/models/" + aiProperties.getModel() + ":generateContent");
    }

    /**
     * Builds the JSON request body expected by Gemini's REST API.
     */
    private JsonNode buildRequestBody(String systemInstruction, List<AiChatMessageRequest> messages) {
        JsonNode root = objectMapper.createObjectNode();
        ((com.fasterxml.jackson.databind.node.ObjectNode) root).set("system_instruction", buildContentNode(systemInstruction));

        com.fasterxml.jackson.databind.node.ArrayNode contents = ((com.fasterxml.jackson.databind.node.ObjectNode) root).putArray("contents");
        for (AiChatMessageRequest message : messages) {
            com.fasterxml.jackson.databind.node.ObjectNode content = contents.addObject();
            content.put("role", normalizeRole(message.getRole()));
            com.fasterxml.jackson.databind.node.ArrayNode parts = content.putArray("parts");
            parts.addObject().put("text", message.getContent());
        }

        com.fasterxml.jackson.databind.node.ObjectNode generationConfig =
                ((com.fasterxml.jackson.databind.node.ObjectNode) root).putObject("generationConfig");
        generationConfig.put("temperature", 0.4);
        generationConfig.put("responseMimeType", "application/json");
        return root;
    }

    /**
     * Wraps text in the Gemini content/parts structure.
     */
    private JsonNode buildContentNode(String text) {
        com.fasterxml.jackson.databind.node.ObjectNode content = objectMapper.createObjectNode();
        content.putArray("parts").addObject().put("text", text);
        return content;
    }

    /**
     * Extracts the combined text body from the top Gemini candidate.
     */
    private String extractText(JsonNode root) {
        JsonNode parts = root.path("candidates").path(0).path("content").path("parts");
        if (!parts.isArray()) {
            return null;
        }

        List<String> chunks = new ArrayList<>();
        for (JsonNode part : parts) {
            JsonNode textNode = part.get("text");
            if (textNode != null && !textNode.asText().isBlank()) {
                chunks.add(textNode.asText());
            }
        }

        return String.join("\n", chunks);
    }

    /**
     * Removes markdown fences so the returned JSON can be deserialized reliably.
     */
    private String sanitizeJson(String value) {
        String sanitized = value.trim();
        if (sanitized.startsWith("```")) {
            sanitized = sanitized.replaceFirst("^```json\\s*", "");
            sanitized = sanitized.replaceFirst("^```\\s*", "");
            sanitized = sanitized.replaceFirst("\\s*```$", "");
        }
        return sanitized.trim();
    }

    /**
     * Maps frontend chat roles to the Gemini REST role names.
     */
    private String normalizeRole(String role) {
        return "assistant".equalsIgnoreCase(role) ? "model" : "user";
    }
}
