package com.example.skillforge.service;

import com.example.skillforge.dto.*;
import com.example.skillforge.entity.Course;
import com.example.skillforge.entity.Enrollment;
import com.example.skillforge.entity.LearningModule;
import com.example.skillforge.entity.Lesson;
import com.example.skillforge.entity.Question;
import com.example.skillforge.entity.Skill;
import com.example.skillforge.entity.User;
import com.example.skillforge.entity.UserSkillLevel;
import com.example.skillforge.exception.ApiException;
import com.example.skillforge.repository.EnrollmentRepository;
import com.example.skillforge.repository.LearningModuleRepository;
import com.example.skillforge.repository.LessonRepository;
import com.example.skillforge.repository.QuestionRepository;
import com.example.skillforge.repository.SkillRepository;
import com.example.skillforge.repository.UserSkillLevelRepository;
import lombok.Builder;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;

/**
 * Builds course-aware tutoring prompts and delegates generation to Gemini.
 */
@Service
@RequiredArgsConstructor
public class AiTutorService {

    private final CourseService courseService;
    private final EnrollmentRepository enrollmentRepository;
    private final LearningModuleRepository learningModuleRepository;
    private final LessonRepository lessonRepository;
    private final QuestionRepository questionRepository;
    private final SkillRepository skillRepository;
    private final UserSkillLevelRepository userSkillLevelRepository;
    private final GeminiClientService geminiClientService;

    /**
     * Generates a structured concept lesson grounded in the student's selected course context.
     */
    public AiTutorTeachResponse teachConcept(User student, AiTutorTeachRequest request) {
        StudyContext context = resolveStudyContext(student, request.getCourseId(), request.getModuleId(), request.getConcept());
        String systemInstruction = """
                You are Skill Forge's AI tutor.
                Teach only from the provided course context.
                Keep the tone professional, concrete, and practical for software learners.
                Return strict JSON with keys:
                concept, courseTitle, moduleTitle, summary, intuition, projectApplication, practiceSteps, commonMistakes, quickChecks, nextStep.
                Use arrays for practiceSteps, commonMistakes, and quickChecks.
                """;

        String userPrompt = """
                Build a focused teaching response for the concept below.

                Student concept: %s
                Student mastery score: %s

                Learning context:
                %s

                Requirements:
                - Keep the explanation tied to the supplied course/module context.
                - Mention one realistic project use case.
                - Make the quick checks short and answerable.
                - Keep all output concise and learner-friendly.
                """.formatted(
                context.concept(),
                context.skillScore() == null ? "unknown" : String.format(Locale.US, "%.1f", context.skillScore()),
                context.contextBlock());

        return geminiClientService.generateStructuredJson(systemInstruction, List.of(toUserMessage(userPrompt)), AiTutorTeachResponse.class);
    }

    /**
     * Generates a context-aware answer for a student doubt using optional conversation history.
     */
    public AiTutorDoubtResponse answerDoubt(User student, AiTutorDoubtRequest request) {
        StudyContext context = resolveStudyContext(student, request.getCourseId(), request.getModuleId(), request.getConcept());
        String systemInstruction = """
                You are Skill Forge's AI doubt-solving tutor.
                Answer only using the provided learning context and the student's concept focus.
                Return strict JSON with keys: answer, keyPoints, followUpPrompt.
                keyPoints must be an array of short bullet-style strings.
                """;

        List<AiChatMessageRequest> messages = new ArrayList<>();
        messages.add(toUserMessage("""
                Learning context:
                %s

                Concept focus: %s
                Student mastery score: %s
                """.formatted(
                context.contextBlock(),
                context.concept(),
                context.skillScore() == null ? "unknown" : String.format(Locale.US, "%.1f", context.skillScore()))));
        if (request.getHistory() != null) {
            messages.addAll(request.getHistory().stream()
                    .filter(item -> item.getContent() != null && !item.getContent().isBlank())
                    .toList());
        }
        messages.add(toUserMessage(request.getQuestion().trim()));

        return geminiClientService.generateStructuredJson(systemInstruction, messages, AiTutorDoubtResponse.class);
    }

    /**
     * Reviews a student's written reflection and returns actionable coaching feedback.
     */
    public AiTutorFeedbackResponse reviewReflection(User student, AiTutorFeedbackRequest request) {
        StudyContext context = resolveStudyContext(student, request.getCourseId(), request.getModuleId(), request.getConcept());
        String systemInstruction = """
                You are Skill Forge's AI feedback coach.
                Evaluate the student's explanation fairly and specifically.
                Return strict JSON with keys: verdict, strengths, improvements, revisedAnswerHint, nextStep.
                strengths and improvements must be arrays.
                """;

        String userPrompt = """
                Review the student reflection below.

                Concept: %s
                Student mastery score: %s
                Learning context:
                %s

                Student reflection:
                %s

                Requirements:
                - Point out what is correct.
                - Explain what is missing or shallow.
                - Suggest how to rewrite the answer with stronger project grounding.
                """.formatted(
                context.concept(),
                context.skillScore() == null ? "unknown" : String.format(Locale.US, "%.1f", context.skillScore()),
                context.contextBlock(),
                request.getReflection().trim());

        return geminiClientService.generateStructuredJson(systemInstruction, List.of(toUserMessage(userPrompt)), AiTutorFeedbackResponse.class);
    }

    /**
     * Generates mock scenarios for the student's completed courses.
     */
    public AiMockGenerateResponse generateMocks(User student, AiMockGenerateRequest request) {
        List<CompletedCourseContext> completedCourses = resolveCompletedCourses(student, request.getCourseIds());
        if (completedCourses.isEmpty()) {
            return AiMockGenerateResponse.builder().mocks(List.of()).build();
        }

        String systemInstruction = """
                You are Skill Forge's AI mock designer.
                Generate project-oriented mocks only from the provided completed-course context.
                Return strict JSON with key mocks.
                Each mock item must contain: courseId, courseTitle, focusConcepts, prompts, evaluationFocus.
                focusConcepts and prompts must be arrays.
                Prompts must feel interview-ready and implementation-oriented.
                """;

        String userPrompt = """
                Create one mock scenario per completed course below.
                Limit prompts to 4 per course.
                Keep prompts concrete, professional, and project-heavy.

                Completed courses:
                %s
                """.formatted(buildCompletedCoursePrompt(completedCourses));

        return geminiClientService.generateStructuredJson(systemInstruction, List.of(toUserMessage(userPrompt)), AiMockGenerateResponse.class);
    }

    /**
     * Resolves the tutoring context and validates that the student can access it.
     */
    private StudyContext resolveStudyContext(User student, Long courseId, Long moduleId, String concept) {
        LearningModule module = null;
        Course course = null;

        if (moduleId != null) {
            module = courseService.getModule(moduleId);
            course = module.getCourse();
            ensureEnrolled(student, course);
        } else if (courseId != null) {
            course = courseService.getCourse(courseId);
            ensureEnrolled(student, course);
        }

        return StudyContext.builder()
                .concept(concept.trim())
                .course(course)
                .module(module)
                .skillScore(findSkillScore(student, concept))
                .contextBlock(buildContextBlock(course, module, concept))
                .build();
    }

    /**
     * Finds the learner's tracked score for a concept when one exists.
     */
    private Double findSkillScore(User student, String concept) {
        return skillRepository.findByName(concept.trim())
                .flatMap(skill -> userSkillLevelRepository.findByUserAndSkill(student, skill))
                .map(UserSkillLevel::getScore)
                .orElse(null);
    }

    /**
     * Builds the textual context passed to Gemini from the selected course and module content.
     */
    private String buildContextBlock(Course course, LearningModule module, String concept) {
        if (course == null) {
            return "No specific course was selected. Teach the concept in a general software-learning context.";
        }

        List<LearningModule> modules = module != null
                ? List.of(module)
                : learningModuleRepository.findByCourseOrderByIdAsc(course).stream().limit(3).toList();

        StringBuilder builder = new StringBuilder();
        builder.append("Course: ").append(course.getTitle()).append('\n');
        builder.append("Course description: ").append(course.getDescription()).append('\n');
        builder.append("Concept focus: ").append(concept.trim()).append('\n');

        for (LearningModule currentModule : modules) {
            builder.append("\nModule: ").append(currentModule.getTitle()).append('\n');

            List<Lesson> lessons = lessonRepository.findByModuleOrderByIdAsc(currentModule).stream().limit(4).toList();
            if (!lessons.isEmpty()) {
                builder.append("Lessons:\n");
                for (Lesson lesson : lessons) {
                    builder.append("- ").append(lesson.getTitle());
                    if (lesson.getTextContent() != null && !lesson.getTextContent().isBlank()) {
                        builder.append(": ").append(summarize(lesson.getTextContent(), 180));
                    }
                    builder.append('\n');
                }
            }

            List<Question> conceptQuestions = questionRepository.findByModuleOrderByIdAsc(currentModule).stream()
                    .filter(question -> matchesConcept(question.getConcept(), concept))
                    .limit(3)
                    .toList();
            List<Question> fallbackQuestions = conceptQuestions.isEmpty()
                    ? questionRepository.findByModuleOrderByIdAsc(currentModule).stream().limit(3).toList()
                    : conceptQuestions;
            if (!fallbackQuestions.isEmpty()) {
                builder.append("Question pool signals:\n");
                for (Question question : fallbackQuestions) {
                    builder.append("- ")
                            .append(question.getStatement())
                            .append(" [concept=")
                            .append(question.getConcept())
                            .append(", difficulty=")
                            .append(question.getDifficulty())
                            .append("]\n");
                }
            }
        }

        return builder.toString().trim();
    }

    /**
     * Resolves the student's completed courses, optionally filtering by requested ids.
     */
    private List<CompletedCourseContext> resolveCompletedCourses(User student, List<Long> requestedCourseIds) {
        Set<Long> requestedIds = requestedCourseIds == null ? Set.of() : new LinkedHashSet<>(requestedCourseIds);
        List<Enrollment> enrollments = enrollmentRepository.findByStudent(student);
        List<CompletedCourseContext> completedCourses = new ArrayList<>();

        for (Enrollment enrollment : enrollments) {
            Course course = enrollment.getCourse();
            if (!requestedIds.isEmpty() && !requestedIds.contains(course.getId())) {
                continue;
            }

            var outline = courseService.getCourseOutline(student, course.getId());
            if (outline.getProgressPercentage() < 100) {
                continue;
            }

            List<String> moduleTitles = outline.getModules().stream()
                    .map(CourseOutlineModuleResponse::getTitle)
                    .limit(5)
                    .toList();
            Set<String> focusConcepts = outline.getModules().stream()
                    .map(module -> courseService.getModule(module.getId()))
                    .flatMap(module -> questionRepository.findByModuleOrderByIdAsc(module).stream())
                    .map(Question::getConcept)
                    .filter(Objects::nonNull)
                    .limit(8)
                    .collect(java.util.stream.Collectors.toCollection(LinkedHashSet::new));

            completedCourses.add(CompletedCourseContext.builder()
                    .courseId(course.getId())
                    .courseTitle(course.getTitle())
                    .description(course.getDescription())
                    .moduleTitles(moduleTitles)
                    .focusConcepts(new ArrayList<>(focusConcepts))
                    .build());
        }

        return completedCourses;
    }

    /**
     * Formats completed-course context for the mock generation prompt.
     */
    private String buildCompletedCoursePrompt(List<CompletedCourseContext> completedCourses) {
        StringBuilder builder = new StringBuilder();
        for (CompletedCourseContext course : completedCourses) {
            builder.append("- courseId: ").append(course.courseId()).append('\n');
            builder.append("  courseTitle: ").append(course.courseTitle()).append('\n');
            builder.append("  description: ").append(course.description()).append('\n');
            builder.append("  modules: ").append(String.join(", ", course.moduleTitles())).append('\n');
            builder.append("  focusConcepts: ").append(String.join(", ", course.focusConcepts())).append("\n\n");
        }
        return builder.toString().trim();
    }

    /**
     * Ensures the student is enrolled in the course before AI context is exposed.
     */
    private void ensureEnrolled(User student, Course course) {
        if (!enrollmentRepository.existsByStudentAndCourse(student, course)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "AI tutor is only available for your enrolled courses");
        }
    }

    /**
     * Trims long lesson content so prompts stay compact and relevant.
     */
    private String summarize(String value, int maxLength) {
        String normalized = value.replaceAll("\\s+", " ").trim();
        if (normalized.length() <= maxLength) {
            return normalized;
        }
        return normalized.substring(0, Math.max(0, maxLength - 3)) + "...";
    }

    /**
     * Performs a case-insensitive concept match.
     */
    private boolean matchesConcept(String left, String right) {
        if (left == null || right == null) {
            return false;
        }
        return left.trim().equalsIgnoreCase(right.trim());
    }

    /**
     * Wraps plain prompt text as a Gemini user message.
     */
    private AiChatMessageRequest toUserMessage(String content) {
        AiChatMessageRequest message = new AiChatMessageRequest();
        message.setRole("user");
        message.setContent(content);
        return message;
    }

    /**
     * Internal tutoring context assembled before a Gemini request is sent.
     */
    @Builder
    private record StudyContext(String concept, Course course, LearningModule module, Double skillScore, String contextBlock) {
    }

    /**
     * Internal representation of a completed course used for mock generation prompts.
     */
    @Builder
    private record CompletedCourseContext(Long courseId,
                                          String courseTitle,
                                          String description,
                                          List<String> moduleTitles,
                                          List<String> focusConcepts) {
    }
}
