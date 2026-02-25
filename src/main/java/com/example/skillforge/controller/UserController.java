package com.example.skillforge.controller;

import com.example.skillforge.dto.UserResponseDto;
import com.example.skillforge.dto.UserStatusUpdateRequest;
import com.example.skillforge.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<UserResponseDto> me(Authentication authentication) {
        return ResponseEntity.ok(userService.getCurrentUser(authentication.getName()));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserResponseDto>> allUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponseDto> updateStatus(@PathVariable Long id,
                                                        @Valid @RequestBody UserStatusUpdateRequest request) {
        return ResponseEntity.ok(userService.updateUserStatus(id, request));
    }

    @PatchMapping("/{id}/trainer-approval")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponseDto> approveTrainer(@PathVariable Long id,
                                                          @RequestParam boolean approved) {
        return ResponseEntity.ok(userService.approveTrainer(id, approved));
    }
}
