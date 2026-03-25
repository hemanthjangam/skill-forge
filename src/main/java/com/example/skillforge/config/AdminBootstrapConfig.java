package com.example.skillforge.config;

import com.example.skillforge.entity.Role;
import com.example.skillforge.entity.User;
import com.example.skillforge.entity.UserStatus;
import com.example.skillforge.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@RequiredArgsConstructor
public class AdminBootstrapConfig {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Bean
    CommandLineRunner ensureAdminUser(
            @Value("${app.bootstrap.admin.enabled:true}") boolean enabled,
            @Value("${app.bootstrap.admin.email:admin@skillforge.local}") String email,
            @Value("${app.bootstrap.admin.password:password}") String password,
            @Value("${app.bootstrap.admin.name:System Admin}") String name) {
        return args -> {
            if (!enabled) {
                return;
            }

            User admin = userRepository.findByEmail(email).orElse(User.builder()
                    .email(email)
                    .build());

            admin.setName(name);
            admin.setPassword(passwordEncoder.encode(password));
            admin.setRole(Role.ADMIN);
            admin.setStatus(UserStatus.ACTIVE);
            userRepository.save(admin);
        };
    }
}
