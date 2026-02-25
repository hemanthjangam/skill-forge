package com.example.skillforge.dto;

import com.example.skillforge.entity.Role;
import com.example.skillforge.entity.UserStatus;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class LoginResponse {
    private String token;
    private String tokenType;
    private Long userId;
    private String name;
    private String email;
    private Role role;
    private UserStatus status;
}
