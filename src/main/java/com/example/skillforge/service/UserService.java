package com.example.skillforge.service;

import com.example.skillforge.dto.UserResponseDto;
import com.example.skillforge.dto.UserProfileResponseDto;
import com.example.skillforge.dto.UserProfileUpdateRequest;
import com.example.skillforge.dto.UserStatusUpdateRequest;
import com.example.skillforge.entity.Role;
import com.example.skillforge.entity.StudentProfile;
import com.example.skillforge.entity.TrainerProfile;
import com.example.skillforge.entity.User;
import com.example.skillforge.entity.UserStatus;
import com.example.skillforge.exception.ApiException;
import com.example.skillforge.repository.StudentProfileRepository;
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
    private final StudentProfileRepository studentProfileRepository;
    private final TrainerProfileRepository trainerProfileRepository;

    /**
     * Loads a user by email or fails with a not-found API error.
     */
    public User getRequiredUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
    }

    /**
     * Loads a user by id or fails with a not-found API error.
     */
    public User getRequiredUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
    }

    /**
     * Returns the authenticated user's base account details.
     */
    public UserResponseDto getCurrentUser(String email) {
        return toDto(getRequiredUserByEmail(email));
    }

    /**
     * Returns all users for admin management views.
     */
    public List<UserResponseDto> getAllUsers() {
        return userRepository.findAll().stream().map(this::toDto).toList();
    }

    /**
     * Allows admins to switch user accounts between active and inactive states.
     */
    @Transactional
    public UserResponseDto updateUserStatus(Long userId, UserStatusUpdateRequest request) {
        if (request.getStatus() != UserStatus.ACTIVE && request.getStatus() != UserStatus.INACTIVE) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Admin can only set ACTIVE or INACTIVE status");
        }
        User user = getRequiredUserById(userId);
        user.setStatus(request.getStatus());
        return toDto(userRepository.save(user));
    }

    /**
     * Returns the authenticated user's profile with role-specific fields included.
     */
    public UserProfileResponseDto getCurrentUserProfile(String email) {
        User user = getRequiredUserByEmail(email);
        return toProfileDto(user);
    }

    /**
     * Updates the authenticated user's shared and role-specific profile data.
     */
    @Transactional
    public UserProfileResponseDto updateCurrentUserProfile(String email, UserProfileUpdateRequest request) {
        User user = getRequiredUserByEmail(email);
        if (userRepository.existsByEmailAndIdNot(request.getEmail(), user.getId())) {
            throw new ApiException(HttpStatus.CONFLICT, "Email already in use");
        }

        user.setName(request.getName());
        user.setEmail(request.getEmail());
        userRepository.save(user);

        if (user.getRole() == Role.STUDENT) {
            StudentProfile profile = studentProfileRepository.findByUser(user)
                    .orElseGet(() -> StudentProfile.builder().user(user).build());
            profile.setEducationLevel(request.getEducationLevel());
            profile.setLearningGoal(request.getLearningGoal());
            studentProfileRepository.save(profile);
        } else if (user.getRole() == Role.TRAINER) {
            TrainerProfile profile = trainerProfileRepository.findByUser(user)
                    .orElseGet(() -> TrainerProfile.builder().user(user).approved(false).build());
            profile.setSpecialization(request.getSpecialization());
            profile.setBio(request.getBio());
            trainerProfileRepository.save(profile);
        }

        return toProfileDto(user);
    }

    /**
     * Approves or rejects a trainer account and syncs the corresponding user status.
     */
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

    /**
     * Maps a user entity to the shared account DTO.
     */
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

    /**
     * Maps a user entity to the profile DTO, including role-specific profile fields.
     */
    public UserProfileResponseDto toProfileDto(User user) {
        UserProfileResponseDto.UserProfileResponseDtoBuilder builder = UserProfileResponseDto.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .status(user.getStatus());

        if (user.getRole() == Role.STUDENT) {
            studentProfileRepository.findByUser(user).ifPresent(profile -> builder
                    .educationLevel(profile.getEducationLevel())
                    .learningGoal(profile.getLearningGoal()));
        } else if (user.getRole() == Role.TRAINER) {
            trainerProfileRepository.findByUser(user).ifPresent(profile -> builder
                    .specialization(profile.getSpecialization())
                    .bio(profile.getBio()));
        }

        return builder.build();
    }
}
