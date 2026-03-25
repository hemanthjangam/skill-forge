package com.example.skillforge.controller;

import com.example.skillforge.dto.*;
import com.example.skillforge.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    /**
     * Registers a new student or trainer account.
     */
    @PostMapping("/register")
    public ResponseEntity<UserResponseDto> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    /**
     * Authenticates a user with email and password.
     */
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    /**
     * Sends a one-time login code to the supplied email address.
     */
    @PostMapping("/login/otp/request")
    public ResponseEntity<MessageResponse> requestLoginOtp(@Valid @RequestBody OtpRequest request) {
        return ResponseEntity.ok(authService.requestLoginOtp(request));
    }

    /**
     * Verifies a login OTP and issues a JWT.
     */
    @PostMapping("/login/otp/verify")
    public ResponseEntity<LoginResponse> verifyLoginOtp(@Valid @RequestBody OtpLoginVerifyRequest request) {
        return ResponseEntity.ok(authService.verifyLoginOtp(request));
    }

    /**
     * Sends a one-time code for the forgot-password flow.
     */
    @PostMapping("/password/forgot/request")
    public ResponseEntity<MessageResponse> requestForgotPasswordOtp(@Valid @RequestBody OtpRequest request) {
        return ResponseEntity.ok(authService.requestForgotPasswordOtp(request));
    }

    /**
     * Resets a password after OTP verification.
     */
    @PostMapping("/password/forgot/reset")
    public ResponseEntity<MessageResponse> resetForgotPassword(@Valid @RequestBody ForgotPasswordResetRequest request) {
        return ResponseEntity.ok(authService.resetPasswordWithOtp(request));
    }
}
