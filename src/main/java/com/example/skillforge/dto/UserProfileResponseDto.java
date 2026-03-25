package com.example.skillforge.dto;

import com.example.skillforge.entity.Role;
import com.example.skillforge.entity.UserStatus;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class UserProfileResponseDto {
    private Long id;
    private String name;
    private String email;
    private Role role;
    private UserStatus status;
    private String educationLevel;
    private String learningGoal;
    private String specialization;
    private String bio;
}
