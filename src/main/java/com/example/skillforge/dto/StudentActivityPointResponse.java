package com.example.skillforge.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;

@Getter
@Builder
public class StudentActivityPointResponse {
    private LocalDate date;
    private long knowledgeChecks;
    private double averageScore;
}
