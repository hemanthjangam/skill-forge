package com.example.skillforge.service;

import com.example.skillforge.dto.QuestionCreateRequest;
import com.example.skillforge.dto.QuestionForQuizResponse;
import com.example.skillforge.dto.QuestionPoolItemResponse;
import com.example.skillforge.dto.QuestionResponse;
import com.example.skillforge.entity.*;
import com.example.skillforge.exception.ApiException;
import com.example.skillforge.repository.EnrollmentRepository;
import com.example.skillforge.repository.LessonRepository;
import com.example.skillforge.repository.QuestionRepository;
import com.example.skillforge.repository.QuizAttemptRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class QuestionService {

    private final QuestionRepository questionRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final LessonRepository lessonRepository;
    private final CourseService courseService;

    /**
     * Adds a trainer-authored question to a module question pool.
     */
    public QuestionResponse addQuestion(User trainer, Long moduleId, QuestionCreateRequest request) {
        LearningModule module = courseService.getModule(moduleId);
        if (!module.getCourse().getCreatedBy().getId().equals(trainer.getId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only course owner can add questions");
        }

        long total = questionRepository.countByModule(module);
        if (total >= 50) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Maximum 50 questions allowed per module");
        }
        if (!request.getOptions().contains(request.getCorrectAnswer())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Correct answer must be one of the options");
        }

        Question question = questionRepository.save(Question.builder()
                .module(module)
                .statement(request.getStatement())
                .topic(request.getTopic())
                .concept(request.getConcept())
                .difficulty(request.getDifficulty())
                .options(request.getOptions())
                .correctAnswer(request.getCorrectAnswer())
                .build());

        return QuestionResponse.builder()
                .id(question.getId())
                .statement(question.getStatement())
                .topic(question.getTopic())
                .concept(question.getConcept())
                .difficulty(question.getDifficulty())
                .options(question.getOptions())
                .build();
    }

    /**
     * Returns the default question set for a module quiz while avoiding recently used questions.
     */
    @Transactional(readOnly = true)
    public List<QuestionForQuizResponse> getQuizQuestions(User student, Long moduleId) {
        LearningModule module = courseService.getModule(moduleId);
        ensureEnrolled(student, module.getCourse());

        Set<Long> recentlyUsed = quizAttemptRepository
                .findByStudentAndModuleOrderByAttemptedAtDesc(student, module, PageRequest.of(0, 3))
                .getContent()
                .stream()
                .flatMap(a -> a.getAnsweredQuestions().stream())
                .map(aq -> aq.getQuestion().getId())
                .collect(java.util.stream.Collectors.toSet());
        return selectQuizQuestions(module, recentlyUsed, List.of(), 5);
    }

    /**
     * Returns lesson-focused quiz questions, falling back to the module pool when needed.
     */
    @Transactional(readOnly = true)
    public List<QuestionForQuizResponse> getQuizQuestionsByLesson(User student, Long lessonId) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Lesson not found"));

        LearningModule module = lesson.getModule();
        ensureEnrolled(student, module.getCourse());

        List<Question> allQuestions = questionRepository.findByModule(module);
        if (allQuestions.size() < 5) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "At least 5 questions required in module");
        }

        List<Question> lessonFocused = allQuestions.stream()
                .filter(q -> q.getTopic() != null && q.getTopic().equalsIgnoreCase(lesson.getTitle()))
                .toList();
        List<Question> selectionBase = lessonFocused.size() >= 5 ? lessonFocused : allQuestions;

        List<Question> shuffled = new ArrayList<>(selectionBase);
        Collections.shuffle(shuffled);

        return shuffled.stream().limit(5)
                .map(q -> QuestionForQuizResponse.builder()
                        .id(q.getId())
                        .statement(q.getStatement())
                        .concept(q.getConcept())
                        .options(q.getOptions())
                        .build())
                .toList();
    }

    /**
     * Returns adaptive follow-up questions, prioritizing weak concepts and excluding prior prompts.
     */
    @Transactional(readOnly = true)
    public List<QuestionForQuizResponse> getAdaptiveQuizQuestions(User student,
            Long moduleId,
            List<Long> askedQuestionIds,
            List<String> focusConcepts,
            int limit) {
        LearningModule module = courseService.getModule(moduleId);
        ensureEnrolled(student, module.getCourse());

        return selectQuizQuestions(module,
                new HashSet<>(askedQuestionIds == null ? List.of() : askedQuestionIds),
                focusConcepts == null ? List.of() : focusConcepts,
                limit);
    }

    /**
     * Returns the full trainer-visible question pool for a module.
     */
    @Transactional(readOnly = true)
    public List<QuestionPoolItemResponse> getModuleQuestionPool(User trainer, Long moduleId) {
        LearningModule module = courseService.getModule(moduleId);
        if (!module.getCourse().getCreatedBy().getId().equals(trainer.getId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only course owner can access question pool");
        }

        return questionRepository.findByModuleOrderByIdAsc(module).stream()
                .map(q -> QuestionPoolItemResponse.builder()
                        .id(q.getId())
                        .statement(q.getStatement())
                        .topic(q.getTopic())
                        .concept(q.getConcept())
                        .difficulty(q.getDifficulty())
                        .options(q.getOptions())
                        .correctAnswer(q.getCorrectAnswer())
                        .build())
                .toList();
    }

    /**
     * Loads questions by id and ensures all of them belong to the expected module.
     */
    public List<Question> getQuestionsByIdsAndModule(List<Long> ids, LearningModule module) {
        List<Question> questions = questionRepository.findAllById(ids);
        if (questions.size() != ids.size()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Some questions are invalid");
        }
        boolean moduleMismatch = questions.stream().anyMatch(q -> !q.getModule().getId().equals(module.getId()));
        if (moduleMismatch) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Questions must belong to the same module");
        }
        return questions;
    }

    /**
     * Ensures that only enrolled students can access course quiz material.
     */
    private void ensureEnrolled(User student, Course course) {
        if (student.getRole() != Role.STUDENT) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only students can access quizzes");
        }
        if (!enrollmentRepository.existsByStudentAndCourse(student, course)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Student is not enrolled in this course");
        }
    }

    /**
     * Selects quiz questions from the module pool with exclusion and concept-focus rules.
     */
    private List<QuestionForQuizResponse> selectQuizQuestions(LearningModule module,
            Set<Long> excludedQuestionIds,
            List<String> focusConcepts,
            int limit) {
        List<Question> allQuestions = questionRepository.findByModule(module);
        if (allQuestions.size() < 5) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "At least 5 questions required in module");
        }

        Set<String> normalizedConcepts = focusConcepts.stream()
                .filter(Objects::nonNull)
                .map(concept -> concept.trim().toLowerCase(Locale.ROOT))
                .filter(concept -> !concept.isBlank())
                .collect(java.util.stream.Collectors.toCollection(LinkedHashSet::new));

        List<Question> filtered = allQuestions.stream()
                .filter(q -> !excludedQuestionIds.contains(q.getId()))
                .filter(q -> normalizedConcepts.isEmpty()
                        || normalizedConcepts.contains(q.getConcept().trim().toLowerCase(Locale.ROOT)))
                .toList();

        List<Question> selectionBase;
        if (!normalizedConcepts.isEmpty() && !filtered.isEmpty()) {
            selectionBase = filtered;
        } else if (normalizedConcepts.isEmpty() && filtered.size() >= limit) {
            selectionBase = filtered;
        } else if (normalizedConcepts.isEmpty()) {
            selectionBase = allQuestions;
        } else {
            selectionBase = List.of();
        }

        List<Question> shuffled = new ArrayList<>(selectionBase);
        Collections.shuffle(shuffled);

        return shuffled.stream()
                .limit(limit)
                .map(this::toQuizResponse)
                .toList();
    }

    /**
     * Maps a question entity to the student quiz response format.
     */
    private QuestionForQuizResponse toQuizResponse(Question question) {
        return QuestionForQuizResponse.builder()
                .id(question.getId())
                .statement(question.getStatement())
                .concept(question.getConcept())
                .options(question.getOptions())
                .build();
    }
}
