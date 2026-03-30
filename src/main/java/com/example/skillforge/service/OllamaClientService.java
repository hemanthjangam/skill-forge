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
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class OllamaClientService {

    private final AiProperties aiProperties;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newHttpClient();

    public <T> T generateStructuredJson(String systemInstruction,
            List<AiChatMessageRequest> messages,
            Class<T> responseType,
            AiTaskProfile taskProfile) {
        try {
            String content = sendChat(resolveModel(taskProfile), systemInstruction, messages);
            if (content == null || content.isBlank()) {
                throw new ApiException(HttpStatus.BAD_GATEWAY, "Local AI provider returned an empty response");
            }
            String extracted = extractJsonPayload(content);
            try {
                return objectMapper.readValue(extracted, responseType);
            } catch (IOException firstFailure) {
                log.warn("Initial Ollama JSON parse failed. Attempting repair. Payload: {}", abbreviate(extracted));
                String repaired = repairJsonPayload(resolveModel(taskProfile), extracted);
                return objectMapper.readValue(repaired, responseType);
            }
        } catch (IOException e) {
            log.warn("Failed to deserialize Ollama response as structured JSON", e);
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Local AI provider returned invalid JSON");
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new ApiException(HttpStatus.GATEWAY_TIMEOUT, "Local AI request was interrupted");
        }
    }

    private String sendChat(String model, String systemInstruction, List<AiChatMessageRequest> messages) throws IOException, InterruptedException {
        String requestBody = objectMapper.writeValueAsString(buildRequestBody(model, systemInstruction, messages));
        HttpRequest request = HttpRequest.newBuilder(buildChatUri())
                .timeout(Duration.ofMillis(aiProperties.getOllama().getTimeoutMs()))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() >= 400) {
            log.warn("Ollama request failed with status {} and body {}", response.statusCode(), response.body());
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Local AI provider request failed");
        }

        JsonNode root = objectMapper.readTree(response.body());
        return root.path("message").path("content").asText();
    }

    private URI buildChatUri() {
        String baseUrl = aiProperties.getOllama().getBaseUrl();
        if (baseUrl.endsWith("/")) {
            baseUrl = baseUrl.substring(0, baseUrl.length() - 1);
        }
        return URI.create(baseUrl + "/api/chat");
    }

    private JsonNode buildRequestBody(String model, String systemInstruction, List<AiChatMessageRequest> messages) {
        var root = objectMapper.createObjectNode();
        root.put("model", model);
        root.put("stream", false);
        root.put("format", "json");
        var options = root.putObject("options");
        options.put("temperature", 0.3);

        var payloadMessages = root.putArray("messages");
        payloadMessages.addObject()
                .put("role", "system")
                .put("content", systemInstruction);
        for (AiChatMessageRequest message : messages) {
            payloadMessages.addObject()
                    .put("role", "assistant".equalsIgnoreCase(message.getRole()) ? "assistant" : "user")
                    .put("content", message.getContent());
        }
        return root;
    }

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
     * Qwen sometimes wraps JSON with extra prose or markdown. Extract the first valid JSON object/array.
     */
    private String extractJsonPayload(String value) {
        String sanitized = sanitizeJson(value);
        if (looksLikeJson(sanitized)) {
            return sanitized;
        }

        int objectStart = sanitized.indexOf('{');
        int arrayStart = sanitized.indexOf('[');
        int start = resolveStart(objectStart, arrayStart);
        if (start < 0) {
            return sanitized;
        }

        char opening = sanitized.charAt(start);
        char closing = opening == '{' ? '}' : ']';
        int depth = 0;
        boolean inString = false;
        boolean escaping = false;

        for (int index = start; index < sanitized.length(); index++) {
            char current = sanitized.charAt(index);

            if (escaping) {
                escaping = false;
                continue;
            }
            if (current == '\\') {
                escaping = true;
                continue;
            }
            if (current == '"') {
                inString = !inString;
                continue;
            }
            if (inString) {
                continue;
            }
            if (current == opening) {
                depth++;
            } else if (current == closing) {
                depth--;
                if (depth == 0) {
                    return sanitized.substring(start, index + 1).trim();
                }
            }
        }

        return sanitized;
    }

    private int resolveStart(int objectStart, int arrayStart) {
        if (objectStart < 0) {
            return arrayStart;
        }
        if (arrayStart < 0) {
            return objectStart;
        }
        return Math.min(objectStart, arrayStart);
    }

    private boolean looksLikeJson(String value) {
        return (value.startsWith("{") && value.endsWith("}"))
                || (value.startsWith("[") && value.endsWith("]"));
    }

    /**
     * If the first response is malformed, ask the model to rewrite only the JSON.
     */
    private String repairJsonPayload(String model, String invalidPayload) throws IOException, InterruptedException {
        String repairInstruction = """
                Rewrite the provided content as strict valid JSON only.
                Do not add markdown, commentary, or explanation.
                Preserve the same meaning and fields.
                """;
        AiChatMessageRequest message = new AiChatMessageRequest();
        message.setRole("user");
        message.setContent(invalidPayload);
        return extractJsonPayload(sendChat(model, repairInstruction, List.of(message)));
    }

    private String abbreviate(String value) {
        if (value == null) {
            return "";
        }
        return value.length() > 600 ? value.substring(0, 600) + "..." : value;
    }

    private String resolveModel(AiTaskProfile taskProfile) {
        if (taskProfile == AiTaskProfile.TUTOR) {
            String tutorModel = aiProperties.getOllama().getTutorModel();
            if (tutorModel != null && !tutorModel.isBlank()) {
                return tutorModel;
            }
        }
        if (taskProfile == AiTaskProfile.GENERATION) {
            String generationModel = aiProperties.getOllama().getGenerationModel();
            if (generationModel != null && !generationModel.isBlank()) {
                return generationModel;
            }
        }
        return aiProperties.getOllama().getModel();
    }
}
