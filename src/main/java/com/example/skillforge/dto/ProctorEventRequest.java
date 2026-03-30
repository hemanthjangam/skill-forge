package com.example.skillforge.dto;

import com.example.skillforge.entity.ExamProctorEventType;
import com.example.skillforge.entity.ExamProctorSeverity;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ProctorEventRequest {
    @NotNull
    private ExamProctorEventType eventType;

    @NotNull
    private ExamProctorSeverity severity;

    private String details;
}
