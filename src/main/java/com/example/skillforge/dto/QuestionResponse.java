package com.example.skillforge.dto;

import com.example.skillforge.entity.Difficulty;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class QuestionResponse {
    private Long id;
    private String statement;
    private String topic;
    private String concept;
    private Difficulty difficulty;
    private List<String> options;
}
