package com.example.skillforge.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Registers the shared Jackson mapper used by controllers and AI integration services.
 */
@Configuration
public class JacksonConfig {

    /**
     * Creates the application's primary ObjectMapper bean.
     */
    @Bean
    public ObjectMapper objectMapper() {
        return new ObjectMapper().findAndRegisterModules();
    }
}
