package com.example.skillforge.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ForgotPasswordResetRequest {
    @Email
    @NotBlank
    private String email;

    @NotBlank
    @Pattern(regexp = "\\d{6}", message = "OTP must be a 6-digit code")
    private String otp;

    @NotBlank
    @Size(min = 6, max = 100)
    private String newPassword;
}
