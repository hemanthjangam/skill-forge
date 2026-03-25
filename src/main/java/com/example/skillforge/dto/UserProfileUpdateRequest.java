package com.example.skillforge.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserProfileUpdateRequest {
    @NotBlank
    private String name;

    @Email
    @NotBlank
    private String email;

    private String educationLevel;
    private String learningGoal;
    private String specialization;
    private String bio;
}
