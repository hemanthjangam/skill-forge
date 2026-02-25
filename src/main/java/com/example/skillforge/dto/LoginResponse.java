package com.example.skillforge.dto;

import com.example.skillforge.entity.Role;
import lombok.*;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class LoginResponse {
    private String username;
    private String email;
    private Role role;
    private String accessToken;
    private String tokenType;
}
