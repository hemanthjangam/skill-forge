package com.example.skillforge.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class OtpLoginVerifyRequest {
    @Email
    @NotBlank
    private String email;

    @NotBlank
    @Pattern(regexp = "\\d{6}", message = "OTP must be a 6-digit code")
    private String otp;
}
