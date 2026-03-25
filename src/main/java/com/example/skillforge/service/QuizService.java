package com.example.skillforge.service;

import com.example.skillforge.dto.QuizAnswerRequest;
import com.example.skillforge.dto.QuestionForQuizResponse;
import com.example.skillforge.dto.QuizRoundRequest;
import com.example.skillforge.dto.QuizRoundResponse;
import com.example.skillforge.dto.QuizSubmitRequest;
import com.example.skillforge.dto.QuizSubmitResponse;
import com.example.skillforge.entity.*;
import com.example.skillforge.exception.ApiException;
import com.example.skillforge.repository.QuizAttemptQuestionRepository;
import com.example.skillforge.repository.QuizAttemptRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class QuizService {

    private static final int INITIAL_QUESTION_COUNT = 5;
    private static final int FOLLOW_UP_QUESTION_COUNT = 5;
    private static final int MAX_SESSION_QUESTIONS = 15;

    private final CourseService courseService;
    private final QuestionService questionService;
    private final QuizAttemptRepository quizAttemptRepository;
    private final QuizAttemptQuestionRepository quizAttemptQuestionRepository;
    private final SkillTrackingService skillTrackingService;
    private final LeaderboardService leaderboardService;
    private final NotificationService notificationService;

    /**
     * Persists a standard module quiz attempt and updates skill, streak, and notification state.
     */
    @Transactional
    public QuizSubmitResponse submitQuiz(User student, QuizSubmitRequest request) {
        if (request.getAnswers().size() < INITIAL_QUESTION_COUNT) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "At least 5 answers are required");
        }

        LearningModule module = courseService.getModule(request.getModuleId());
        return persistQuizAttempt(student, module, request.getAnswers());
    }

    /**
     * Processes an adaptive quiz round and either schedules follow-up questions or finalizes the attempt.
     */
    @Transactional
    public QuizRoundResponse processQuizRound(User student, QuizRoundRequest request) {
        if (request.getCurrentRoundQuestionIds().isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Current round question ids are required");
        }
        if (request.getAnswers().size() < request.getCurrentRoundQuestionIds().size()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "All current round answers must be included");
        }
        if (request.getAnswers().size() > MAX_SESSION_QUESTIONS) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Adaptive quiz is limited to 15 questions per module session");
        }

        LearningModule module = courseService.getModule(request.getModuleId());
        List<Long> answerQuestionIds = request.getAnswers().stream().map(QuizAnswerRequest::getQuestionId).toList();
        Map<Long, Question> questionMap = loadQuestionMap(module, answerQuestionIds);

        List<String> weakConcepts = evaluateWeakConcepts(questionMap, request.getAnswers(), request.getCurrentRoundQuestionIds());
        int currentRoundCorrectAnswers = countCorrectAnswers(questionMap, request.getAnswers(), request.getCurrentRoundQuestionIds());

        int remainingSlots = MAX_SESSION_QUESTIONS - request.getAnswers().size();
        if (!weakConcepts.isEmpty() && remainingSlots > 0) {
            List<QuestionForQuizResponse> nextQuestions = questionService.getAdaptiveQuizQuestions(
                    student,
                    request.getModuleId(),
                    answerQuestionIds,
                    weakConcepts,
                    Math.min(FOLLOW_UP_QUESTION_COUNT, remainingSlots));

            if (!nextQuestions.isEmpty()) {
                return QuizRoundResponse.builder()
                        .completed(false)
                        .totalAnsweredQuestions(request.getAnswers().size())
                        .currentRoundTotalQuestions(request.getCurrentRoundQuestionIds().size())
                        .currentRoundCorrectAnswers(currentRoundCorrectAnswers)
                        .weakConcepts(weakConcepts)
                        .nextQuestions(nextQuestions)
                        .build();
            }
        }

        QuizSubmitResponse result = persistQuizAttempt(student, module, request.getAnswers());
        return QuizRoundResponse.builder()
                .completed(true)
                .totalAnsweredQuestions(request.getAnswers().size())
                .currentRoundTotalQuestions(request.getCurrentRoundQuestionIds().size())
                .currentRoundCorrectAnswers(currentRoundCorrectAnswers)
                .weakConcepts(weakConcepts)
                .result(result)
                .build();
    }

    /**
     * Stores the final quiz attempt, computes concept accuracy, and updates downstream analytics.
     */
    private QuizSubmitResponse persistQuizAttempt(User student, LearningModule module, List<QuizAnswerRequest> answers) {
        List<Long> questionIds = answers.stream().map(QuizAnswerRequest::getQuestionId).toList();
        Map<Long, Question> questionMap = loadQuestionMap(module, questionIds);
        Map<Long, QuizAnswerRequest> answerMap = answers.stream()
                .collect(Collectors.toMap(QuizAnswerRequest::getQuestionId, Function.identity(), (first, second) -> second));

        int correct = 0;
        Map<String, Integer> conceptTotal = new HashMap<>();
        Map<String, Integer> conceptCorrect = new HashMap<>();

        QuizAttempt attempt = quizAttemptRepository.save(QuizAttempt.builder()
                .student(student)
                .module(module)
                .totalQuestions(answers.size())
                .correctAnswers(0)
                .scorePercentage(0.0)
                .build());

        for (QuizAnswerRequest answer : answerMap.values()) {
            Question question = questionMap.get(answer.getQuestionId());
            if (question == null) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid question id " + answer.getQuestionId());
            }
            boolean isCorrect = question.getCorrectAnswer().equals(answer.getSelectedAnswer());
            if (isCorrect) {
                correct++;
            }

            conceptTotal.merge(question.getConcept(), 1, Integer::sum);
            if (isCorrect) {
                conceptCorrect.merge(question.getConcept(), 1, Integer::sum);
            }

            quizAttemptQuestionRepository.save(QuizAttemptQuestion.builder()
                    .quizAttempt(attempt)
                    .question(question)
                    .selectedAnswer(answer.getSelectedAnswer())
                    .correct(isCorrect)
                    .build());
        }

        double score = (correct * 100.0) / answers.size();
        attempt.setCorrectAnswers(correct);
        attempt.setScorePercentage(score);
        attempt = quizAttemptRepository.save(attempt);

        Map<String, Double> conceptAccuracy = new HashMap<>();
        for (Map.Entry<String, Integer> entry : conceptTotal.entrySet()) {
            int correctCount = conceptCorrect.getOrDefault(entry.getKey(), 0);
            conceptAccuracy.put(entry.getKey(), (correctCount * 100.0) / entry.getValue());
        }

        skillTrackingService.updateSkillScores(student, conceptAccuracy);
        leaderboardService.recordKnowledgeCheck(student);

        int points = correct * 10;
        leaderboardService.addPoints(student, points);

        notificationService.createNotification(student,
                "Quiz completed for module '" + module.getTitle() + "' with score " + score + "%");

        return QuizSubmitResponse.builder()
                .attemptId(attempt.getId())
                .totalQuestions(attempt.getTotalQuestions())
                .correctAnswers(attempt.getCorrectAnswers())
                .scorePercentage(attempt.getScorePercentage())
                .conceptAccuracy(conceptAccuracy)
                .attemptedAt(attempt.getAttemptedAt())
                .build();
    }

    /**
     * Loads the requested questions and indexes them by id for fast validation and scoring.
     */
    private Map<Long, Question> loadQuestionMap(LearningModule module, List<Long> questionIds) {
        List<Long> uniqueQuestionIds = questionIds.stream().distinct().toList();
        List<Question> questions = questionService.getQuestionsByIdsAndModule(uniqueQuestionIds, module);
        return questions.stream().collect(Collectors.toMap(Question::getId, Function.identity()));
    }

    /**
     * Identifies the concepts answered incorrectly in the current adaptive round.
     */
    private List<String> evaluateWeakConcepts(Map<Long, Question> questionMap,
            List<QuizAnswerRequest> answers,
            List<Long> currentRoundQuestionIds) {
        Map<Long, QuizAnswerRequest> answerMap = answers.stream()
                .collect(Collectors.toMap(QuizAnswerRequest::getQuestionId, Function.identity(), (first, second) -> second));
        List<String> weakConcepts = new ArrayList<>();
        for (Long questionId : currentRoundQuestionIds) {
            QuizAnswerRequest answer = Optional.ofNullable(answerMap.get(questionId))
                    .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Missing answer for question " + questionId));
            Question question = questionMap.get(questionId);
            if (question == null) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid question id " + questionId);
            }
            if (!question.getCorrectAnswer().equals(answer.getSelectedAnswer()) && !weakConcepts.contains(question.getConcept())) {
                weakConcepts.add(question.getConcept());
            }
        }
        return weakConcepts;
    }

    /**
     * Counts correct answers in the current adaptive round.
     */
    private int countCorrectAnswers(Map<Long, Question> questionMap,
            List<QuizAnswerRequest> answers,
            List<Long> currentRoundQuestionIds) {
        Map<Long, QuizAnswerRequest> answerMap = answers.stream()
                .collect(Collectors.toMap(QuizAnswerRequest::getQuestionId, Function.identity(), (first, second) -> second));
        int correctAnswers = 0;
        for (Long questionId : currentRoundQuestionIds) {
            QuizAnswerRequest answer = Optional.ofNullable(answerMap.get(questionId))
                    .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Missing answer for question " + questionId));
            Question question = questionMap.get(questionId);
            if (question != null && question.getCorrectAnswer().equals(answer.getSelectedAnswer())) {
                correctAnswers++;
            }
        }
        return correctAnswers;
    }
}
