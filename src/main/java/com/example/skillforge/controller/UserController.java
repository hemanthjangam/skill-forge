package com.example.skillforge.controller;

import com.example.skillforge.dto.LoginRequest;
import com.example.skillforge.dto.LoginResponse;
import com.example.skillforge.dto.UserRequestDto;
import com.example.skillforge.dto.UserResponseDto;
import com.example.skillforge.dto.UserUpdateDto;
import com.example.skillforge.entity.Role;
import com.example.skillforge.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/users")
public class UserController {
    private final UserService userService;

    @PostMapping("/register")
    public ResponseEntity<UserResponseDto> registerUser (@RequestBody UserRequestDto request) {
        return ResponseEntity.ok(userService.registerUser(request));
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login (@RequestBody LoginRequest request) {
        return ResponseEntity.ok(userService.login(request));
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponseDto> getCurrentUser(Authentication authentication) {
        return ResponseEntity.ok(userService.getCurrentUser(authentication.getName()));
    }

    @PutMapping("/me")
    public ResponseEntity<UserResponseDto> updateCurrentUser(
            Authentication authentication,
            @RequestBody UserUpdateDto request
    ) {
        return ResponseEntity.ok(userService.updateCurrentUser(authentication.getName(), request));
    }

    @PatchMapping("/me")
    public ResponseEntity<UserResponseDto> patchCurrentUser(
            Authentication authentication,
            @RequestBody UserUpdateDto request
    ) {
        return ResponseEntity.ok(userService.updateCurrentUser(authentication.getName(), request));
    }

    @DeleteMapping("/me")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteCurrentUser(Authentication authentication) {
        userService.deleteCurrentUser(authentication.getName());
    }

    @GetMapping("/admin/users")
    public ResponseEntity<List<UserResponseDto>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @PostMapping("/admin/users")
    public ResponseEntity<UserResponseDto> adminCreateUser(@RequestBody UserRequestDto request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.adminCreateUser(request));
    }

    @GetMapping("/admin/users/{id}")
    public ResponseEntity<UserResponseDto> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @PutMapping("/admin/users/{id}")
    public ResponseEntity<UserResponseDto> updateUserById(@PathVariable Long id, @RequestBody UserUpdateDto request) {
        return ResponseEntity.ok(userService.adminUpdateUser(id, request));
    }

    @PatchMapping("/admin/users/{id}")
    public ResponseEntity<UserResponseDto> patchUserById(@PathVariable Long id, @RequestBody UserUpdateDto request) {
        return ResponseEntity.ok(userService.adminUpdateUser(id, request));
    }

    @DeleteMapping("/admin/users/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteUserById(@PathVariable Long id) {
        userService.deleteUser(id);
    }

    @PatchMapping("/admin/users/{id}/status")
    public ResponseEntity<UserResponseDto> updateUserStatus(
            @PathVariable Long id,
            @RequestParam boolean active
    ) {
        return ResponseEntity.ok(userService.setUserStatus(id, active));
    }

    @PatchMapping("/admin/users/{id}/role")
    public ResponseEntity<UserResponseDto> updateUserRole(
            @PathVariable Long id,
            @RequestParam Role role
    ) {
        return ResponseEntity.ok(userService.changeUserRole(id, role));
    }

    @GetMapping("/admin/roles/{role}/users")
    public ResponseEntity<List<UserResponseDto>> getUsersByRole(@PathVariable Role role) {
        return ResponseEntity.ok(userService.getUsersByRole(role));
    }

    @GetMapping("/admin/dashboard")
    public ResponseEntity<Map<String, Object>> getAdminDashboard() {
        return ResponseEntity.ok(userService.getAdminDashboard());
    }

    @GetMapping("/admin/ping")
    public ResponseEntity<String> adminPing() {
        return ResponseEntity.ok("ADMIN access granted");
    }

    @GetMapping("/trainer/profile")
    public ResponseEntity<UserResponseDto> getTrainerProfile(Authentication authentication) {
        return ResponseEntity.ok(userService.getCurrentUser(authentication.getName()));
    }

    @GetMapping("/trainer/learners")
    public ResponseEntity<List<UserResponseDto>> getLearnersForTrainer() {
        return ResponseEntity.ok(userService.getUsersByRole(Role.LEARNER));
    }

    @GetMapping("/trainer/ping")
    public ResponseEntity<String> trainerPing() {
        return ResponseEntity.ok("TRAINER access granted");
    }

    @GetMapping("/learner/profile")
    public ResponseEntity<UserResponseDto> getLearnerProfile(Authentication authentication) {
        return ResponseEntity.ok(userService.getCurrentUser(authentication.getName()));
    }

    @GetMapping("/learner/ping")
    public ResponseEntity<String> learnerPing() {
        return ResponseEntity.ok("LEARNER access granted");
    }
}
