package com.example.skillforge.service;

import com.example.skillforge.dto.QuizAnswerRequest;
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

    private final CourseService courseService;
    private final QuestionService questionService;
    private final QuizAttemptRepository quizAttemptRepository;
    private final QuizAttemptQuestionRepository quizAttemptQuestionRepository;
    private final SkillTrackingService skillTrackingService;
    private final LeaderboardService leaderboardService;
    private final NotificationService notificationService;

    @Transactional
    public QuizSubmitResponse submitQuiz(User student, QuizSubmitRequest request) {
        if (request.getAnswers().size() != 5) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Exactly 5 answers are required");
        }

        LearningModule module = courseService.getModule(request.getModuleId());
        List<Long> questionIds = request.getAnswers().stream().map(QuizAnswerRequest::getQuestionId).toList();
        List<Question> questions = questionService.getQuestionsByIdsAndModule(questionIds, module);
        Map<Long, Question> questionMap = questions.stream().collect(Collectors.toMap(Question::getId, Function.identity()));

        int correct = 0;
        Map<String, Integer> conceptTotal = new HashMap<>();
        Map<String, Integer> conceptCorrect = new HashMap<>();

        QuizAttempt attempt = quizAttemptRepository.save(QuizAttempt.builder()
                .student(student)
                .module(module)
                .totalQuestions(request.getAnswers().size())
                .correctAnswers(0)
                .scorePercentage(0.0)
                .build());

        for (QuizAnswerRequest answer : request.getAnswers()) {
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

        double score = (correct * 100.0) / request.getAnswers().size();
        attempt.setCorrectAnswers(correct);
        attempt.setScorePercentage(score);
        attempt = quizAttemptRepository.save(attempt);

        Map<String, Double> conceptAccuracy = new HashMap<>();
        for (Map.Entry<String, Integer> entry : conceptTotal.entrySet()) {
            int correctCount = conceptCorrect.getOrDefault(entry.getKey(), 0);
            conceptAccuracy.put(entry.getKey(), (correctCount * 100.0) / entry.getValue());
        }

        skillTrackingService.updateSkillScores(student, conceptAccuracy);

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
}
