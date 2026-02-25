package com.example.skillforge.service;

import com.example.skillforge.dto.UserResponseDto;
import com.example.skillforge.dto.UserStatusUpdateRequest;
import com.example.skillforge.entity.Role;
import com.example.skillforge.entity.TrainerProfile;
import com.example.skillforge.entity.User;
import com.example.skillforge.entity.UserStatus;
import com.example.skillforge.exception.ApiException;
import com.example.skillforge.repository.TrainerProfileRepository;
import com.example.skillforge.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final TrainerProfileRepository trainerProfileRepository;

    public User getRequiredUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
    }

    public User getRequiredUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
    }

    public UserResponseDto getCurrentUser(String email) {
        return toDto(getRequiredUserByEmail(email));
    }

    public List<UserResponseDto> getAllUsers() {
        return userRepository.findAll().stream().map(this::toDto).toList();
    }

    @Transactional
    public UserResponseDto updateUserStatus(Long userId, UserStatusUpdateRequest request) {
        User user = getRequiredUserById(userId);
        user.setStatus(request.getStatus());
        return toDto(userRepository.save(user));
    }

    @Transactional
    public UserResponseDto approveTrainer(Long userId, boolean approved) {
        User user = getRequiredUserById(userId);
        if (user.getRole() != Role.TRAINER) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "User is not a trainer");
        }

        TrainerProfile profile = trainerProfileRepository.findByUser(user)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Trainer profile not found"));

        profile.setApproved(approved);
        user.setStatus(approved ? UserStatus.ACTIVE : UserStatus.INACTIVE);
        trainerProfileRepository.save(profile);
        return toDto(userRepository.save(user));
    }

    public UserResponseDto toDto(User user) {
        return UserResponseDto.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .status(user.getStatus())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
