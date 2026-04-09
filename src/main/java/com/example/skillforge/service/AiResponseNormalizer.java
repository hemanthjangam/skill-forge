package com.example.skillforge.service;

import com.example.skillforge.dto.AiGeneratedExamDraftResponse;
import com.example.skillforge.dto.AiGeneratedExamQuestionResponse;
import com.example.skillforge.dto.AiMockGenerateResponse;
import com.example.skillforge.dto.AiMockScenarioResponse;
import com.example.skillforge.dto.AiTutorDoubtResponse;
import com.example.skillforge.dto.AiTutorFeedbackResponse;
import com.example.skillforge.dto.AiTutorTeachResponse;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Locale;

@Component
@RequiredArgsConstructor
public class AiResponseNormalizer {

    private final ObjectMapper objectMapper;

    public <T> T normalizeAndConvert(JsonNode root, Class<T> responseType) {
        JsonNode normalized = normalize(root, responseType);
        return objectMapper.convertValue(normalized, responseType);
    }

    private JsonNode normalize(JsonNode root, Class<?> responseType) {
        if (responseType == AiTutorTeachResponse.class) {
            return normalizeTeach(root);
        }
        if (responseType == AiTutorDoubtResponse.class) {
            return normalizeDoubt(root);
        }
        if (responseType == AiTutorFeedbackResponse.class) {
            return normalizeFeedback(root);
        }
        if (responseType == AiMockGenerateResponse.class) {
            return normalizeMocks(root);
        }
        if (responseType == AiGeneratedExamDraftResponse.class) {
            return normalizeExamDraft(root);
        }
        return root;
    }

    private JsonNode normalizeTeach(JsonNode root) {
        ObjectNode node = objectNode(root);
        putString(node, "concept", root.path("concept"));
        putString(node, "courseTitle", root.path("courseTitle"));
        putString(node, "moduleTitle", root.path("moduleTitle"));
        putString(node, "summary", root.path("summary"));
        putString(node, "intuition", root.path("intuition"));
        node.set("projectApplication", toStringArray(root.path("projectApplication")));
        node.set("practiceSteps", toStringArray(root.path("practiceSteps")));
        node.set("commonMistakes", toStringArray(root.path("commonMistakes")));
        node.set("quickChecks", toStringArray(root.path("quickChecks")));
        putString(node, "nextStep", root.path("nextStep"));
        return node;
    }

    private JsonNode normalizeDoubt(JsonNode root) {
        ObjectNode node = objectNode(root);
        putString(node, "answer", root.path("answer"));
        node.set("keyPoints", toStringArray(root.path("keyPoints")));
        putString(node, "followUpPrompt", root.path("followUpPrompt"));
        return node;
    }

    private JsonNode normalizeFeedback(JsonNode root) {
        ObjectNode node = objectNode(root);
        putString(node, "verdict", root.path("verdict"));
        node.set("strengths", toStringArray(root.path("strengths")));
        node.set("improvements", toStringArray(root.path("improvements")));
        putString(node, "revisedAnswerHint", root.path("revisedAnswerHint"));
        putString(node, "nextStep", root.path("nextStep"));
        return node;
    }

    private JsonNode normalizeMocks(JsonNode root) {
        ObjectNode node = objectNode(root);
        JsonNode mocksNode = root.isArray() ? root : root.path("mocks");
        ArrayNode mocks = JsonNodeFactory.instance.arrayNode();
        if (mocksNode.isArray()) {
            for (JsonNode item : mocksNode) {
                ObjectNode normalized = objectNode(item);
                if (item.path("courseId").canConvertToLong()) {
                    normalized.put("courseId", item.path("courseId").asLong());
                }
                String courseTitle = firstNonBlank(
                        textValue(item.path("courseTitle")),
                        textValue(item.path("title")),
                        "Course Mock"
                );
                normalized.put("courseTitle", courseTitle);
                normalized.put("scenarioTitle", firstNonBlank(
                        textValue(item.path("scenarioTitle")),
                        textValue(item.path("title")),
                        courseTitle + " Scenario"
                ));
                normalized.put("scenarioBrief", firstNonBlank(
                        textValue(item.path("scenarioBrief")),
                        textValue(item.path("summary")),
                        textValue(item.path("description")),
                        "Apply the completed course concepts in a realistic build-and-explain scenario."
                ));
                normalized.put("learnerGoal", firstNonBlank(
                        textValue(item.path("learnerGoal")),
                        "Show that you can translate course knowledge into implementation decisions."
                ));
                normalized.put("deliverable", firstNonBlank(
                        textValue(item.path("deliverable")),
                        "A concise implementation walkthrough, design explanation, and working solution outline."
                ));
                normalized.set("focusConcepts", toStringArray(item.path("focusConcepts")));
                normalized.set("taskChecklist", mergeArrays(item.path("taskChecklist"), item.path("prompts")));
                normalized.set("constraints", toStringArray(item.path("constraints")));
                normalized.set("evaluationFocus", toStringArray(item.path("evaluationFocus")));
                mocks.add(normalized);
            }
        }
        node.set("mocks", mocks);
        return node;
    }

    private JsonNode normalizeExamDraft(JsonNode root) {
        ObjectNode node = objectNode(root);
        putString(node, "title", root.path("title"));
        putString(node, "description", root.path("description"));

        ArrayNode questions = JsonNodeFactory.instance.arrayNode();
        JsonNode questionNodes = root.path("questions");
        if (questionNodes.isArray()) {
            for (JsonNode item : questionNodes) {
                ObjectNode normalized = objectNode(item);
                putString(normalized, "statement", item.path("statement"));
                putString(normalized, "concept", item.path("concept"));
                String difficulty = normalizeDifficulty(item.path("difficulty"));
                if (!difficulty.isBlank()) {
                    normalized.put("difficulty", difficulty);
                }
                normalized.set("options", toStringArray(item.path("options")));
                putString(normalized, "correctAnswer", item.path("correctAnswer"));
                putString(normalized, "explanation", item.path("explanation"));
                if (item.path("moduleId").canConvertToLong()) {
                    normalized.put("moduleId", item.path("moduleId").asLong());
                }
                questions.add(normalized);
            }
        }
        node.set("questions", questions);
        return node;
    }

    private ObjectNode objectNode(JsonNode root) {
        if (root instanceof ObjectNode objectNode) {
            return objectNode.deepCopy();
        }
        return JsonNodeFactory.instance.objectNode();
    }

    private void putString(ObjectNode node, String fieldName, JsonNode value) {
        if (value == null || value.isMissingNode() || value.isNull()) {
            return;
        }
        if (value.isArray()) {
            ArrayNode array = toStringArray(value);
            if (!array.isEmpty()) {
                node.put(fieldName, array.get(0).asText());
            }
            return;
        }
        if (value.isObject()) {
            node.put(fieldName, value.toString());
            return;
        }
        String text = value.asText("").trim();
        if (!text.isEmpty()) {
            node.put(fieldName, text);
        }
    }

    private ArrayNode toStringArray(JsonNode value) {
        ArrayNode array = JsonNodeFactory.instance.arrayNode();
        if (value == null || value.isMissingNode() || value.isNull()) {
            return array;
        }
        if (value.isArray()) {
            for (JsonNode item : value) {
                String text = item == null ? "" : item.asText("").trim();
                if (!text.isEmpty()) {
                    array.add(text);
                }
            }
            return array;
        }

        String text = value.asText("").trim();
        if (text.isEmpty()) {
            return array;
        }

        if (looksLikeList(text)) {
            for (String part : text.split("\\r?\\n|;|,|\\u2022")) {
                String cleaned = part.trim();
                if (!cleaned.isEmpty()) {
                    array.add(cleaned);
                }
            }
            if (!array.isEmpty()) {
                return array;
            }
        }

        array.add(text);
        return array;
    }

    private boolean looksLikeList(String text) {
        return text.contains("\n") || text.contains(";") || text.contains(", ");
    }

    private ArrayNode mergeArrays(JsonNode primary, JsonNode fallback) {
        ArrayNode primaryValues = toStringArray(primary);
        if (!primaryValues.isEmpty()) {
            return primaryValues;
        }
        return toStringArray(fallback);
    }

    private String textValue(JsonNode node) {
        if (node == null || node.isMissingNode() || node.isNull()) {
            return "";
        }
        return node.asText("").trim();
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value.trim();
            }
        }
        return "";
    }

    private String normalizeDifficulty(JsonNode difficultyNode) {
        String value = difficultyNode == null ? "" : difficultyNode.asText("").trim();
        if (value.isEmpty()) {
            return "";
        }
        String normalized = value.toUpperCase(Locale.ROOT);
        if ("BEGINNER".equals(normalized)) {
            return "EASY";
        }
        if ("HARD".equals(normalized) || "MEDIUM".equals(normalized) || "EASY".equals(normalized)) {
            return normalized;
        }
        return "MEDIUM";
    }
}
