package com.example.skillforge.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class AiMockGenerateRequest {
    private List<Long> courseIds = new ArrayList<>();
}
