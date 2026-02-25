package com.example.skillforge.dto;

import com.example.skillforge.entity.UserStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserStatusUpdateRequest {
    @NotNull
    private UserStatus status;
}
