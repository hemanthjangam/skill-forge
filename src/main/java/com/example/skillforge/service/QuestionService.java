package com.example.skillforge.service;

import com.example.skillforge.dto.QuestionCreateRequest;
import com.example.skillforge.dto.QuestionForQuizResponse;
import com.example.skillforge.dto.QuestionResponse;
import com.example.skillforge.entity.*;
import com.example.skillforge.exception.ApiException;
import com.example.skillforge.repository.EnrollmentRepository;
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
    private final CourseService courseService;

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

    @Transactional(readOnly = true)
    public List<QuestionForQuizResponse> getQuizQuestions(User student, Long moduleId) {
        LearningModule module = courseService.getModule(moduleId);
        ensureEnrolled(student, module.getCourse());

        List<Question> allQuestions = questionRepository.findByModule(module);
        if (allQuestions.size() < 5) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "At least 5 questions required in module");
        }

        Set<Long> recentlyUsed = quizAttemptRepository
                .findByStudentAndModuleOrderByAttemptedAtDesc(student, module, PageRequest.of(0, 3))
                .getContent()
                .stream()
                .flatMap(a -> a.getAnsweredQuestions().stream())
                .map(aq -> aq.getQuestion().getId())
                .collect(java.util.stream.Collectors.toSet());

        List<Question> candidatePool = allQuestions.stream()
                .filter(q -> !recentlyUsed.contains(q.getId()))
                .toList();

        List<Question> selectionBase = candidatePool.size() >= 5 ? candidatePool : allQuestions;

        // Future AI integration point: replace random shuffling with adaptive selection strategy.
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

    private void ensureEnrolled(User student, Course course) {
        if (student.getRole() != Role.STUDENT) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only students can access quizzes");
        }
        if (!enrollmentRepository.existsByStudentAndCourse(student, course)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Student is not enrolled in this course");
        }
    }
}
