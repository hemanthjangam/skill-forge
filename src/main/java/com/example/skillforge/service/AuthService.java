package com.example.skillforge.service;

import com.example.skillforge.dto.*;
import com.example.skillforge.entity.*;
import com.example.skillforge.exception.ApiException;
import com.example.skillforge.repository.StudentProfileRepository;
import com.example.skillforge.repository.TrainerProfileRepository;
import com.example.skillforge.repository.UserRepository;
import com.example.skillforge.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final TrainerProfileRepository trainerProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final UserService userService;

    @Transactional
    public UserResponseDto register(RegisterRequest request) {
        if (request.getRole() == Role.ADMIN) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Admin registration is not allowed");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ApiException(HttpStatus.CONFLICT, "Email already in use");
        }

        UserStatus initialStatus = request.getRole() == Role.TRAINER
                ? UserStatus.PENDING_APPROVAL
                : UserStatus.ACTIVE;

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .status(initialStatus)
                .build();

        user = userRepository.save(user);

        if (user.getRole() == Role.STUDENT) {
            studentProfileRepository.save(StudentProfile.builder()
                    .user(user)
                    .educationLevel(request.getEducationLevel())
                    .learningGoal(request.getLearningGoal())
                    .build());
        } else if (user.getRole() == Role.TRAINER) {
            trainerProfileRepository.save(TrainerProfile.builder()
                    .user(user)
                    .specialization(request.getSpecialization())
                    .bio(request.getBio())
                    .approved(false)
                    .build());
        }

        return userService.toDto(user);
    }

    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }
        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new ApiException(HttpStatus.FORBIDDEN, "User is not active");
        }

        return LoginResponse.builder()
                .token(jwtService.generateToken(user.getEmail(), user.getRole()))
                .tokenType("Bearer")
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .status(user.getStatus())
                .build();
    }
}
