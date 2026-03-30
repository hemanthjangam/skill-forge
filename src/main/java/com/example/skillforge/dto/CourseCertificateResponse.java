package com.example.skillforge.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class CourseCertificateResponse {
    private Long courseId;
    private String courseTitle;
    private String certificateCode;
    private LocalDateTime issuedAt;
}
