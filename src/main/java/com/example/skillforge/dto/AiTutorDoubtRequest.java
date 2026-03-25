package com.example.skillforge.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class AiTutorDoubtRequest {
    private Long courseId;
    private Long moduleId;

    @NotBlank
    private String concept;

    @NotBlank
    private String question;

    @Valid
    private List<AiChatMessageRequest> history = new ArrayList<>();
}
