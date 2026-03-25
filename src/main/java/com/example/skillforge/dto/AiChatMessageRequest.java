package com.example.skillforge.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AiChatMessageRequest {
    @NotBlank
    private String role;

    @NotBlank
    private String content;
}
