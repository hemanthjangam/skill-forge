package com.example.skillforge.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CourseApprovalRequest {
    @NotNull
    private Boolean approved;
}
