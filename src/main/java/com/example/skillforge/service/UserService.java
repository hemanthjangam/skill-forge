package com.example.skillforge.service;

import com.example.skillforge.dto.LoginRequest;
import com.example.skillforge.dto.LoginResponse;
import com.example.skillforge.dto.UserRequestDto;
import com.example.skillforge.dto.UserResponseDto;
import com.example.skillforge.dto.UserUpdateDto;
import com.example.skillforge.entity.Role;
import com.example.skillforge.entity.User;
import com.example.skillforge.repository.UserRepository;
import com.example.skillforge.security.JwtService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Transactional
    public UserResponseDto registerUser(UserRequestDto request) {
        Role requestedRole = request.getRole() == null ? Role.LEARNER : request.getRole();
        if (requestedRole == Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Public registration cannot create ADMIN accounts");
        }
        return createUser(request, requestedRole);
    }

    @Transactional
    public UserResponseDto adminCreateUser(UserRequestDto request) {
        Role role = request.getRole() == null ? Role.LEARNER : request.getRole();
        return createUser(request, role);
    }

    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid password");
        }

        if (!Boolean.TRUE.equals(user.getIsActive())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "User account is inactive");
        }

        String accessToken = jwtService.generateToken(user.getEmail(), user.getRole());

        return LoginResponse.builder()
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole())
                .accessToken(accessToken)
                .tokenType("Bearer")
                .build();
    }

    public UserResponseDto getCurrentUser(String email) {
        return mapToResponse(findByEmailOrThrow(email));
    }

    public List<UserResponseDto> getAllUsers() {
        return userRepository.findAll().stream().map(this::mapToResponse).toList();
    }

    public List<UserResponseDto> getUsersByRole(Role role) {
        return userRepository.findAll()
                .stream()
                .filter(user -> user.getRole() == role)
                .map(this::mapToResponse)
                .toList();
    }

    public UserResponseDto getUserById(Long id) {
        return mapToResponse(findByIdOrThrow(id));
    }

    @Transactional
    public UserResponseDto updateCurrentUser(String email, UserUpdateDto updateRequest) {
        User user = findByEmailOrThrow(email);
        applyUserUpdates(user, updateRequest, false);
        return mapToResponse(userRepository.save(user));
    }

    @Transactional
    public UserResponseDto adminUpdateUser(Long id, UserUpdateDto updateRequest) {
        User user = findByIdOrThrow(id);
        applyUserUpdates(user, updateRequest, true);
        return mapToResponse(userRepository.save(user));
    }

    @Transactional
    public void deleteCurrentUser(String email) {
        User user = findByEmailOrThrow(email);
        user.setIsActive(false);
        userRepository.save(user);
    }

    @Transactional
    public void deleteUser(Long id) {
        User user = findByIdOrThrow(id);
        userRepository.delete(user);
    }

    @Transactional
    public UserResponseDto setUserStatus(Long id, boolean active) {
        User user = findByIdOrThrow(id);
        user.setIsActive(active);
        return mapToResponse(userRepository.save(user));
    }

    @Transactional
    public UserResponseDto changeUserRole(Long id, Role role) {
        User user = findByIdOrThrow(id);
        user.setRole(role);
        return mapToResponse(userRepository.save(user));
    }

    public Map<String, Object> getAdminDashboard() {
        long totalUsers = userRepository.count();
        long learners = userRepository.countByRole(Role.LEARNER);
        long trainers = userRepository.countByRole(Role.TRAINER);
        long admins = userRepository.countByRole(Role.ADMIN);
        long activeUsers = userRepository.countByIsActive(true);
        long inactiveUsers = userRepository.countByIsActive(false);
        long newUsersLast7Days = userRepository.countByCreatedAtAfter(LocalDateTime.now().minusDays(7));
        long newUsersLast30Days = userRepository.countByCreatedAtAfter(LocalDateTime.now().minusDays(30));

        Map<String, Object> dashboard = new LinkedHashMap<>();
        dashboard.put("totalUsers", totalUsers);
        dashboard.put("activeUsers", activeUsers);
        dashboard.put("inactiveUsers", inactiveUsers);
        dashboard.put("roleBreakdown", Map.of(
                "learners", learners,
                "trainers", trainers,
                "admins", admins
        ));
        dashboard.put("newUsersLast7Days", newUsersLast7Days);
        dashboard.put("newUsersLast30Days", newUsersLast30Days);
        dashboard.put("courseModeration", Map.of(
                "pendingCourseApprovals", 0,
                "approvedCourses", 0,
                "rejectedCourses", 0
        ));
        return dashboard;
    }

    private UserResponseDto createUser(UserRequestDto request, Role role) {
        validateCreateRequest(request);
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "User already exists with this email");
        }
        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(role)
                .build();
        return mapToResponse(userRepository.save(user));
    }

    private void validateCreateRequest(UserRequestDto request) {
        if (request.getUsername() == null || request.getUsername().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username is required");
        }
        if (request.getEmail() == null || request.getEmail().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is required");
        }
        if (request.getPassword() == null || request.getPassword().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password is required");
        }
    }

    private void applyUserUpdates(User user, UserUpdateDto updateRequest, boolean adminUpdate) {
        if (updateRequest.getUsername() != null && !updateRequest.getUsername().isBlank()) {
            user.setUsername(updateRequest.getUsername());
        }
        if (updateRequest.getEmail() != null && !updateRequest.getEmail().isBlank()) {
            if (!updateRequest.getEmail().equalsIgnoreCase(user.getEmail())
                    && userRepository.existsByEmail(updateRequest.getEmail())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "User already exists with this email");
            }
            user.setEmail(updateRequest.getEmail());
        }
        if (updateRequest.getPassword() != null && !updateRequest.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(updateRequest.getPassword()));
        }
        if (adminUpdate && updateRequest.getRole() != null) {
            user.setRole(updateRequest.getRole());
        }
        if (adminUpdate && updateRequest.getIsActive() != null) {
            user.setIsActive(updateRequest.getIsActive());
        }
    }

    private User findByIdOrThrow(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private User findByEmailOrThrow(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    public UserResponseDto mapToResponse(User user) {
        return UserResponseDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole())
                .isActive(user.getIsActive())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
