package com.example.skillforge.service;

import com.example.skillforge.dto.*;
import com.example.skillforge.entity.*;
import com.example.skillforge.exception.ApiException;
import com.example.skillforge.repository.OtpTokenRepository;
import com.example.skillforge.repository.StudentProfileRepository;
import com.example.skillforge.repository.TrainerProfileRepository;
import com.example.skillforge.repository.UserRepository;
import com.example.skillforge.security.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.mail.MailException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
@Slf4j
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final TrainerProfileRepository trainerProfileRepository;
    private final OtpTokenRepository otpTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final JavaMailSender mailSender;
    @Value("${spring.mail.username:}")
    private String mailFrom;
    private final UserService userService;
    private static final SecureRandom OTP_RANDOM = new SecureRandom();
    private static final int OTP_EXPIRY_MINUTES = 10;

    /**
     * Registers a new student or trainer account and provisions the matching profile record.
     */
    @Transactional
    public UserResponseDto register(RegisterRequest request) {
        String normalizedEmail = normalizeEmail(request.getEmail());
        if (request.getRole() == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Role is required");
        }
        if (request.getRole() != Role.STUDENT && request.getRole() != Role.TRAINER) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only STUDENT and TRAINER registration is allowed");
        }
        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new ApiException(HttpStatus.CONFLICT, "Email already in use");
        }

        UserStatus initialStatus = request.getRole() == Role.TRAINER
                ? UserStatus.PENDING_APPROVAL
                : UserStatus.ACTIVE;

        User user = User.builder()
                .name(request.getName())
                .email(normalizedEmail)
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

    /**
     * Authenticates a user with email and password and returns a JWT on success.
     */
    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(normalizeEmail(request.getEmail()))
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }
        if (user.getStatus() == UserStatus.PENDING_APPROVAL) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Your account is pending admin approval");
        }
        if (user.getStatus() == UserStatus.INACTIVE) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Your account is inactive. Contact admin");
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

    /**
     * Generates and emails a one-time login code for a user that is allowed to sign in.
     */
    @Transactional
    public MessageResponse requestLoginOtp(OtpRequest request) {
        User user = userRepository.findByEmail(normalizeEmail(request.getEmail()))
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
        ensureUserCanLogin(user);

        String code = generateOtp();
        otpTokenRepository.save(OtpToken.builder()
                .email(user.getEmail())
                .otpCode(code)
                .purpose(OtpPurpose.LOGIN)
                .used(false)
                .expiresAt(LocalDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES))
                .build());

        sendOtpEmail(user.getEmail(), code, "Login OTP");
        return new MessageResponse("OTP sent to your email");
    }

    /**
     * Verifies a login OTP and returns a JWT for the authenticated user.
     */
    @Transactional
    public LoginResponse verifyLoginOtp(OtpLoginVerifyRequest request) {
        String normalizedEmail = normalizeEmail(request.getEmail());
        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid OTP credentials"));
        ensureUserCanLogin(user);

        OtpToken token = otpTokenRepository.findTopByEmailAndPurposeAndUsedFalseOrderByCreatedAtDesc(
                        normalizedEmail, OtpPurpose.LOGIN)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "OTP not found or already used"));
        validateOtpToken(token, request.getOtp());
        token.setUsed(true);
        otpTokenRepository.save(token);

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

    /**
     * Generates and emails a password reset OTP for the requested account.
     */
    @Transactional
    public MessageResponse requestForgotPasswordOtp(OtpRequest request) {
        User user = userRepository.findByEmail(normalizeEmail(request.getEmail()))
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));

        String code = generateOtp();
        otpTokenRepository.save(OtpToken.builder()
                .email(user.getEmail())
                .otpCode(code)
                .purpose(OtpPurpose.FORGOT_PASSWORD)
                .used(false)
                .expiresAt(LocalDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES))
                .build());

        sendOtpEmail(user.getEmail(), code, "Password Reset OTP");
        return new MessageResponse("OTP sent to your email");
    }

    /**
     * Resets the account password after validating the submitted OTP.
     */
    @Transactional
    public MessageResponse resetPasswordWithOtp(ForgotPasswordResetRequest request) {
        String normalizedEmail = normalizeEmail(request.getEmail());
        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));

        OtpToken token = otpTokenRepository.findTopByEmailAndPurposeAndUsedFalseOrderByCreatedAtDesc(
                        normalizedEmail, OtpPurpose.FORGOT_PASSWORD)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "OTP not found or already used"));
        validateOtpToken(token, request.getOtp());

        token.setUsed(true);
        otpTokenRepository.save(token);

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        return new MessageResponse("Password updated successfully");
    }

    /**
     * Rejects login attempts for users that are not in a sign-in ready state.
     */
    private void ensureUserCanLogin(User user) {
        if (user.getStatus() == UserStatus.PENDING_APPROVAL) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Your account is pending admin approval");
        }
        if (user.getStatus() == UserStatus.INACTIVE) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Your account is inactive. Contact admin");
        }
    }

    /**
     * Validates OTP ownership, freshness, and value before the token is consumed.
     */
    private void validateOtpToken(OtpToken token, String otp) {
        if (token.isUsed()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "OTP already used");
        }
        if (token.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "OTP expired");
        }
        if (!token.getOtpCode().equals(otp)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid OTP");
        }
    }

    /**
     * Produces a six-digit OTP code using a cryptographically secure random source.
     */
    private String generateOtp() {
        int value = OTP_RANDOM.nextInt(1_000_000);
        return String.format("%06d", value);
    }

    /**
     * Sends an OTP email and fails the request when SMTP delivery is not available.
     */
    private void sendOtpEmail(String email, String otp, String subjectPrefix) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            if (mailFrom != null && !mailFrom.isBlank()) {
                message.setFrom(mailFrom);
            }
            message.setTo(email);
            message.setSubject(subjectPrefix + " - Skill Forge");
            message.setText("Your OTP is: " + otp + "\nIt is valid for " + OTP_EXPIRY_MINUTES + " minutes.");
            mailSender.send(message);
        } catch (MailException e) {
            log.error("Unable to send OTP email via SMTP. Intended recipient: {}, subject: {}",
                    email, subjectPrefix, e);
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE,
                    "OTP email could not be sent. Check SMTP configuration and try again.");
        }
    }

    /**
     * Normalizes user-supplied email values for stable lookups and uniqueness checks.
     */
    private String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase();
    }
}
