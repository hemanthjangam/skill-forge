package com.example.skillforge.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DoubtResolveRequest {
    @NotBlank
    private String resolution;
}
