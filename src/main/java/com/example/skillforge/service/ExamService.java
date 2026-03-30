package com.example.skillforge.service;

import com.example.skillforge.dto.AiChatMessageRequest;
import com.example.skillforge.dto.AiGeneratedExamDraftResponse;
import com.example.skillforge.dto.AiGeneratedExamQuestionResponse;
import com.example.skillforge.dto.ExamAttemptAnswerRequest;
import com.example.skillforge.dto.ExamAttemptReviewResponse;
import com.example.skillforge.dto.ExamDetailResponse;
import com.example.skillforge.dto.ExamGenerateRequest;
import com.example.skillforge.dto.ExamQuestionResponse;
import com.example.skillforge.dto.ExamStartResponse;
import com.example.skillforge.dto.ExamSubmitRequest;
import com.example.skillforge.dto.ExamSubmitResponse;
import com.example.skillforge.dto.ExamSummaryResponse;
import com.example.skillforge.dto.ProctorEventRequest;
import com.example.skillforge.entity.Course;
import com.example.skillforge.entity.CourseExam;
import com.example.skillforge.entity.CourseExamAttempt;
import com.example.skillforge.entity.CourseExamAttemptAnswer;
import com.example.skillforge.entity.CourseExamQuestion;
import com.example.skillforge.entity.CourseExamStatus;
import com.example.skillforge.entity.Difficulty;
import com.example.skillforge.entity.Enrollment;
import com.example.skillforge.entity.ExamAttemptStatus;
import com.example.skillforge.entity.ExamProctorEvent;
import com.example.skillforge.entity.ExamProctorSeverity;
import com.example.skillforge.entity.LearningModule;
import com.example.skillforge.entity.Question;
import com.example.skillforge.entity.Role;
import com.example.skillforge.entity.User;
import com.example.skillforge.exception.ApiException;
import com.example.skillforge.repository.CourseExamAttemptRepository;
import com.example.skillforge.repository.CourseExamRepository;
import com.example.skillforge.repository.EnrollmentRepository;
import com.example.skillforge.repository.ExamProctorEventRepository;
import com.example.skillforge.repository.QuestionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExamService {

    private final CourseService courseService;
    private final CourseExamRepository courseExamRepository;
    private final CourseExamAttemptRepository courseExamAttemptRepository;
    private final ExamProctorEventRepository examProctorEventRepository;
    private final QuestionRepository questionRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final NotificationService notificationService;
    private final AiGenerationService aiGenerationService;
    private final StudentSupportService studentSupportService;
    private final LeaderboardService leaderboardService;

    @Transactional
    public ExamSummaryResponse generateExam(User author, Long courseId, ExamGenerateRequest request) {
        Course course = courseService.getCourse(courseId);
        ensureCanGenerate(author, course);

        List<Question> sourceQuestions = questionRepository.findByModuleCourseId(courseId);
        if (sourceQuestions.size() < 5) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "At least 5 module questions are required before generating an exam");
        }

        CourseExam exam = CourseExam.builder()
                .course(course)
                .title(optionalText(request.getTitle(), course.getTitle() + " Certification Exam"))
                .description(optionalText(request.getDescription(), "AI-generated reusable exam aligned to course modules and concepts."))
                .status(CourseExamStatus.PUBLISHED)
                .generatedBy(author)
                .durationMinutes(request.getDurationMinutes())
                .questionCount(request.getQuestionCount())
                .build();

        List<CourseExamQuestion> generatedQuestions = tryAiGeneration(course, request, sourceQuestions);
        if (generatedQuestions.isEmpty()) {
            generatedQuestions = fallbackQuestions(exam, sourceQuestions, request.getQuestionCount());
        } else {
            generatedQuestions.forEach(question -> question.setExam(exam));
        }

        exam.setQuestionCount(generatedQuestions.size());
        exam.setQuestions(generatedQuestions);
        CourseExam saved = courseExamRepository.save(exam);
        return toSummary(saved);
    }

    public List<ExamSummaryResponse> getCourseExams(User student, Long courseId) {
        Course course = courseService.getCourse(courseId);
        ensureEnrolled(student, course);
        return courseExamRepository.findByCourseAndStatusOrderByCreatedAtDesc(course, CourseExamStatus.PUBLISHED).stream()
                .map(this::toSummary)
                .toList();
    }

    public List<ExamSummaryResponse> getTrainerExams(User trainer) {
        if (trainer.getRole() != Role.TRAINER && trainer.getRole() != Role.ADMIN) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only trainers or admins can access generated exams");
        }
        return courseExamRepository.findByCourseCreatedByOrderByCreatedAtDesc(trainer).stream()
                .map(this::toSummary)
                .toList();
    }

    @Transactional
    public ExamStartResponse startExam(User student, Long examId) {
        CourseExam exam = getExam(examId);
        ensureEnrolled(student, exam.getCourse());

        Optional<CourseExamAttempt> existingAttempt =
                courseExamAttemptRepository.findByExamAndStudentAndStatus(exam, student, ExamAttemptStatus.IN_PROGRESS);
        CourseExamAttempt attempt = existingAttempt.orElseGet(() -> courseExamAttemptRepository.save(CourseExamAttempt.builder()
                .exam(exam)
                .student(student)
                .status(ExamAttemptStatus.IN_PROGRESS)
                .totalQuestions(exam.getQuestions().size())
                .correctAnswers(0)
                .scorePercentage(0.0)
                .proctoringScore(100.0)
                .violationCount(0)
                .build()));

        return ExamStartResponse.builder()
                .attemptId(attempt.getId())
                .examId(exam.getId())
                .title(exam.getTitle())
                .durationMinutes(exam.getDurationMinutes())
                .startedAt(attempt.getStartedAt())
                .questions(exam.getQuestions().stream().map(question -> toQuestionResponse(question, null, false, false)).toList())
                .build();
    }

    @Transactional
    public void recordProctorEvent(User student, Long attemptId, ProctorEventRequest request) {
        CourseExamAttempt attempt = getAttempt(attemptId);
        ensureAttemptOwner(student, attempt);
        if (attempt.getStatus() != ExamAttemptStatus.IN_PROGRESS) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Proctoring events can only be recorded during an active attempt");
        }

        examProctorEventRepository.save(ExamProctorEvent.builder()
                .examAttempt(attempt)
                .eventType(request.getEventType())
                .severity(request.getSeverity())
                .details(request.getDetails())
                .build());
    }

    @Transactional
    public ExamSubmitResponse submitAttempt(User student, Long attemptId, ExamSubmitRequest request) {
        CourseExamAttempt attempt = getAttempt(attemptId);
        ensureAttemptOwner(student, attempt);
        if (attempt.getStatus() == ExamAttemptStatus.SUBMITTED) {
            throw new ApiException(HttpStatus.CONFLICT, "Exam attempt was already submitted");
        }

        Map<Long, CourseExamQuestion> questionMap = attempt.getExam().getQuestions().stream()
                .collect(Collectors.toMap(CourseExamQuestion::getId, item -> item));
        Map<Long, ExamAttemptAnswerRequest> answerMap = request.getAnswers().stream()
                .collect(Collectors.toMap(ExamAttemptAnswerRequest::getQuestionId, item -> item, (first, second) -> second));

        if (answerMap.size() < attempt.getExam().getQuestions().size()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "All exam questions must be answered");
        }

        attempt.getAnswers().clear();
        int correctAnswers = 0;
        List<ExamQuestionResponse> reviewQuestions = new ArrayList<>();
        for (CourseExamQuestion question : attempt.getExam().getQuestions()) {
            ExamAttemptAnswerRequest answer = Optional.ofNullable(answerMap.get(question.getId()))
                    .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Missing answer for question " + question.getId()));
            boolean correct = question.getCorrectAnswer().equals(answer.getSelectedAnswer());
            if (correct) {
                correctAnswers++;
            }
            attempt.getAnswers().add(CourseExamAttemptAnswer.builder()
                    .examAttempt(attempt)
                    .examQuestion(question)
                    .selectedAnswer(answer.getSelectedAnswer())
                    .correct(correct)
                    .build());
            reviewQuestions.add(toQuestionResponse(question, answer.getSelectedAnswer(), correct, true));
        }

        List<ExamProctorEvent> events = examProctorEventRepository.findByExamAttemptOrderByCreatedAtAsc(attempt);
        int penalty = events.stream().mapToInt(this::severityPenalty).sum();
        double proctoringScore = Math.max(0, 100 - penalty);

        attempt.setStatus(ExamAttemptStatus.SUBMITTED);
        attempt.setSubmittedAt(LocalDateTime.now());
        attempt.setCorrectAnswers(correctAnswers);
        attempt.setTotalQuestions(attempt.getExam().getQuestions().size());
        attempt.setScorePercentage(correctAnswers * 100.0 / attempt.getExam().getQuestions().size());
        attempt.setViolationCount(events.size());
        attempt.setProctoringScore(proctoringScore);
        CourseExamAttempt saved = courseExamAttemptRepository.save(attempt);

        leaderboardService.recordKnowledgeCheck(student);
        leaderboardService.addPoints(student, correctAnswers * 12);
        studentSupportService.synchronizeStudentArtifacts(student);
        notificationService.createNotification(student,
                "Exam submitted: '" + saved.getExam().getTitle() + "' with score " + Math.round(saved.getScorePercentage()) + "%");

        return ExamSubmitResponse.builder()
                .attemptId(saved.getId())
                .examId(saved.getExam().getId())
                .examTitle(saved.getExam().getTitle())
                .scorePercentage(saved.getScorePercentage())
                .correctAnswers(saved.getCorrectAnswers())
                .totalQuestions(saved.getTotalQuestions())
                .proctoringScore(saved.getProctoringScore())
                .violationCount(saved.getViolationCount())
                .feedbackSummary(buildFeedbackSummary(saved))
                .submittedAt(saved.getSubmittedAt())
                .questions(reviewQuestions)
                .build();
    }

    public ExamAttemptReviewResponse getAttemptReview(User student, Long attemptId) {
        CourseExamAttempt attempt = getAttempt(attemptId);
        ensureAttemptOwner(student, attempt);
        return ExamAttemptReviewResponse.builder()
                .attemptId(attempt.getId())
                .examId(attempt.getExam().getId())
                .examTitle(attempt.getExam().getTitle())
                .courseTitle(attempt.getExam().getCourse().getTitle())
                .scorePercentage(attempt.getScorePercentage())
                .correctAnswers(attempt.getCorrectAnswers())
                .totalQuestions(attempt.getTotalQuestions())
                .proctoringScore(attempt.getProctoringScore())
                .violationCount(attempt.getViolationCount())
                .startedAt(attempt.getStartedAt())
                .submittedAt(attempt.getSubmittedAt())
                .questions(attempt.getAnswers().stream()
                        .map(answer -> toQuestionResponse(
                                answer.getExamQuestion(),
                                answer.getSelectedAnswer(),
                                answer.isCorrect(),
                                true))
                        .toList())
                .build();
    }

    public ExamDetailResponse getExamDetail(User requester, Long examId) {
        CourseExam exam = getExam(examId);
        if (requester.getRole() == Role.STUDENT) {
            ensureEnrolled(requester, exam.getCourse());
        } else {
            ensureCanGenerate(requester, exam.getCourse());
        }
        return ExamDetailResponse.builder()
                .examId(exam.getId())
                .courseId(exam.getCourse().getId())
                .courseTitle(exam.getCourse().getTitle())
                .title(exam.getTitle())
                .description(exam.getDescription())
                .questionCount(exam.getQuestionCount())
                .durationMinutes(exam.getDurationMinutes())
                .questions(exam.getQuestions().stream()
                        .map(question -> toQuestionResponse(question, null, false, requester.getRole() != Role.STUDENT))
                        .toList())
                .build();
    }

    private List<CourseExamQuestion> tryAiGeneration(Course course, ExamGenerateRequest request, List<Question> sourceQuestions) {
        try {
            String systemInstruction = """
                    You generate reusable course exams for SkillForge.
                    Return strict JSON with keys: title, description, questions.
                    Each question must contain: statement, concept, difficulty, options, correctAnswer, explanation, moduleId.
                    Keep exactly 4 options per question.
                    Keep all questions grounded in the provided course material and module concepts.
                    """;
            String context = buildCourseContext(course, sourceQuestions, request.getQuestionCount());
            AiChatMessageRequest message = new AiChatMessageRequest();
            message.setRole("user");
            message.setContent(context);
            AiGeneratedExamDraftResponse response = aiGenerationService.generateStructuredJson(systemInstruction,
                    List.of(message),
                    AiGeneratedExamDraftResponse.class,
                    AiTaskProfile.GENERATION);
            if (response == null || response.getQuestions() == null || response.getQuestions().isEmpty()) {
                return List.of();
            }

            Map<Long, LearningModule> moduleMap = course.getModules().stream()
                    .collect(Collectors.toMap(LearningModule::getId, item -> item));

            List<CourseExamQuestion> questions = new ArrayList<>();
            for (AiGeneratedExamQuestionResponse item : response.getQuestions()) {
                if (item.getOptions() == null || item.getOptions().size() < 4 || item.getCorrectAnswer() == null) {
                    continue;
                }
                questions.add(CourseExamQuestion.builder()
                        .module(moduleMap.get(item.getModuleId()))
                        .statement(item.getStatement())
                        .concept(optionalText(item.getConcept(), "course application"))
                        .difficulty(item.getDifficulty() == null ? Difficulty.MEDIUM : item.getDifficulty())
                        .options(item.getOptions().stream().limit(4).toList())
                        .correctAnswer(item.getCorrectAnswer())
                        .explanation(optionalText(item.getExplanation(), "This answer best matches the course concept and implementation trade-off."))
                        .build());
            }
            return questions.stream().limit(request.getQuestionCount()).toList();
        } catch (RuntimeException ignored) {
            return List.of();
        }
    }

    private String buildCourseContext(Course course, List<Question> sourceQuestions, int questionCount) {
        StringBuilder builder = new StringBuilder();
        builder.append("Course title: ").append(course.getTitle()).append('\n');
        builder.append("Course description: ").append(course.getDescription()).append('\n');
        builder.append("Requested question count: ").append(questionCount).append('\n');
        builder.append("Modules and lessons:\n");
        for (LearningModule module : course.getModules()) {
            builder.append("- Module ").append(module.getId()).append(": ").append(module.getTitle()).append('\n');
            module.getLessons().stream().limit(3).forEach(lesson ->
                    builder.append("  Lesson: ").append(lesson.getTitle())
                            .append(" | ").append(optionalText(lesson.getTextContent(), "non-text lesson"))
                            .append('\n'));
        }
        builder.append("Existing module question bank:\n");
        sourceQuestions.stream().limit(18).forEach(question ->
                builder.append("- module ").append(question.getModule().getId())
                        .append(" | concept ").append(question.getConcept())
                        .append(" | difficulty ").append(question.getDifficulty())
                        .append(" | prompt ").append(question.getStatement())
                        .append('\n'));
        return builder.toString();
    }

    private List<CourseExamQuestion> fallbackQuestions(CourseExam exam, List<Question> sourceQuestions, int requestedCount) {
        List<Question> shuffled = new ArrayList<>(sourceQuestions);
        Collections.shuffle(shuffled);
        return shuffled.stream()
                .limit(requestedCount)
                .map(question -> CourseExamQuestion.builder()
                        .exam(exam)
                        .module(question.getModule())
                        .statement(question.getStatement())
                        .concept(question.getConcept())
                        .difficulty(question.getDifficulty())
                        .options(question.getOptions())
                        .correctAnswer(question.getCorrectAnswer())
                        .explanation("This option matches the correct concept application expected in the course question bank.")
                        .build())
                .toList();
    }

    private ExamQuestionResponse toQuestionResponse(CourseExamQuestion question, String selectedAnswer, boolean correct, boolean includeSolutions) {
        return ExamQuestionResponse.builder()
                .id(question.getId())
                .statement(question.getStatement())
                .concept(question.getConcept())
                .difficulty(question.getDifficulty())
                .options(question.getOptions())
                .selectedAnswer(selectedAnswer)
                .correct(correct)
                .correctAnswer(includeSolutions ? question.getCorrectAnswer() : null)
                .explanation(includeSolutions ? question.getExplanation() : null)
                .build();
    }

    private ExamSummaryResponse toSummary(CourseExam exam) {
        return ExamSummaryResponse.builder()
                .examId(exam.getId())
                .courseId(exam.getCourse().getId())
                .courseTitle(exam.getCourse().getTitle())
                .title(exam.getTitle())
                .description(exam.getDescription())
                .questionCount(exam.getQuestionCount())
                .durationMinutes(exam.getDurationMinutes())
                .createdAt(exam.getCreatedAt())
                .build();
    }

    private String buildFeedbackSummary(CourseExamAttempt attempt) {
        List<String> weakConcepts = attempt.getAnswers().stream()
                .filter(answer -> !answer.isCorrect())
                .map(answer -> answer.getExamQuestion().getConcept())
                .distinct()
                .limit(3)
                .toList();
        if (weakConcepts.isEmpty()) {
            return "Strong performance. Focus on explaining your decisions clearly and maintaining the same discipline under timed conditions.";
        }
        return "Review these concepts next: " + String.join(", ", weakConcepts)
                + ". Your score will improve fastest by revisiting the related module lessons and retrying the exam under stricter time discipline.";
    }

    private int severityPenalty(ExamProctorEvent event) {
        if (event.getSeverity() == ExamProctorSeverity.HIGH) {
            return 12;
        }
        if (event.getSeverity() == ExamProctorSeverity.MEDIUM) {
            return 7;
        }
        return 3;
    }

    private CourseExam getExam(Long examId) {
        return courseExamRepository.findById(examId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Exam not found"));
    }

    private CourseExamAttempt getAttempt(Long attemptId) {
        return courseExamAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Exam attempt not found"));
    }

    private void ensureAttemptOwner(User student, CourseExamAttempt attempt) {
        if (student.getRole() != Role.STUDENT || !attempt.getStudent().getId().equals(student.getId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Student cannot access this exam attempt");
        }
    }

    private void ensureEnrolled(User student, Course course) {
        if (student.getRole() != Role.STUDENT) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only students can access exams");
        }
        if (!enrollmentRepository.existsByStudentAndCourse(student, course)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Student is not enrolled in this course");
        }
    }

    private void ensureCanGenerate(User author, Course course) {
        if (author.getRole() == Role.ADMIN) {
            return;
        }
        if (author.getRole() != Role.TRAINER || !course.getCreatedBy().getId().equals(author.getId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only the trainer owner or an admin can generate exams");
        }
    }

    private String optionalText(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }
}
