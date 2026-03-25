import api from './axios';
import type { UserSkillLevel } from '../types/skills';

export interface CourseResponse {
  id: number;
  title: string;
  description: string;
  approvalStatus: string;
  trainerId: number;
  trainerName: string;
  createdAt: string;
}

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface CourseOutlineLessonResponse {
  id: number;
  title: string;
  contentType: string;
  contentUrl?: string;
  textContent?: string;
  imageUrl?: string;
  videoUrl?: string;
  orderIndex: number;
  isCompleted: boolean;
}

export interface CourseOutlineModuleResponse {
  id: number;
  title: string;
  questionCount: number;
  lessons: CourseOutlineLessonResponse[];
}

export interface CourseOutline {
  courseId: number;
  title: string;
  description: string;
  approvalStatus: string;
  trainerId: number;
  trainerName: string;
  modules: CourseOutlineModuleResponse[];
  isEnrolled: boolean;
  progressPercentage: number;
}

export interface LeaderboardEntry {
  rank: number;
  userId: number;
  userName: string;
  points: number;
}

export interface StreakBoardEntry {
  rank: number;
  userId: number;
  userName: string;
  currentStreak: number;
  bestStreak: number;
  totalKnowledgeChecks: number;
  points: number;
}

export interface StreakSummary {
  userId: number;
  userName: string;
  currentStreak: number;
  bestStreak: number;
  totalKnowledgeChecks: number;
  points: number;
  lastActiveDate?: string;
}

// --- Course Builder Types ---

export interface ModuleResponse {
  id: number;
  title: string;
  courseId: number;
}

export interface LessonResponse {
  id: number;
  title: string;
  contentType: string;
  textContent?: string;
  imageUrl?: string;
  videoUrl?: string;
  moduleId: number;
}

export interface LessonCreatePayload {
  title: string;
  contentType: 'TEXT' | 'IMAGE' | 'VIDEO' | 'TEXT_IMAGE';
  textContent?: string;
  imageUrl?: string;
  videoUrl?: string;
}

export interface QuestionCreatePayload {
  statement: string;
  topic: string;
  concept: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  options: string[];
  correctAnswer: string;
}

export interface QuestionPoolItem {
  id: number;
  statement: string;
  topic: string;
  concept: string;
  difficulty: string;
  options: string[];
  correctAnswer: string;
}

// --- Quiz Types ---

export interface QuizQuestion {
  id: number;
  statement: string;
  concept: string;
  options: string[];
}

export interface QuizAnswerPayload {
  questionId: number;
  selectedAnswer: string;
}

export interface QuizSubmitPayload {
  moduleId: number;
  answers: QuizAnswerPayload[];
}

export interface QuizRoundPayload {
  moduleId: number;
  answers: QuizAnswerPayload[];
  currentRoundQuestionIds: number[];
}

export interface QuizSubmitResult {
  attemptId: number;
  totalQuestions: number;
  correctAnswers: number;
  scorePercentage: number;
  conceptAccuracy: Record<string, number>;
  attemptedAt: string;
  moduleId: number;
  moduleTitle?: string;
  courseId?: number;
}

export interface QuizRoundResult {
  completed: boolean;
  totalAnsweredQuestions: number;
  currentRoundTotalQuestions: number;
  currentRoundCorrectAnswers: number;
  weakConcepts: string[];
  nextQuestions?: QuizQuestion[];
  result?: QuizSubmitResult;
}

export const courseApi = {
  getPublishedCourses: async (page = 0, size = 20): Promise<PagedResponse<CourseResponse>> => {
    const response = await api.get('/courses/published', { params: { page, size } });
    return response.data;
  },

  getCourseOutline: async (courseId: number | string): Promise<CourseOutline> => {
    const response = await api.get(`/courses/${courseId}/outline`);
    return response.data;
  },

  getTrainerCourses: async (): Promise<CourseResponse[]> => {
    const response = await api.get('/trainer/courses');
    return response.data;
  },

  deleteCourse: async (courseId: number | string): Promise<void> => {
    await api.delete(`/courses/${courseId}`);
  },

  enrollInCourse: async (courseId: number | string): Promise<void> => {
    await api.post(`/courses/${courseId}/enroll`);
  },

  markLessonComplete: async (lessonId: number | string): Promise<void> => {
    await api.post(`/lessons/${lessonId}/complete`);
  },

  // --- Course Builder APIs ---

  createCourse: async (title: string, description: string): Promise<CourseResponse> => {
    const response = await api.post('/courses', { title, description });
    return response.data;
  },

  addModule: async (courseId: number, title: string): Promise<ModuleResponse> => {
    const response = await api.post(`/courses/${courseId}/modules`, { title });
    return response.data;
  },

  addLesson: async (moduleId: number, payload: LessonCreatePayload): Promise<LessonResponse> => {
    const response = await api.post(`/modules/${moduleId}/lessons`, payload);
    return response.data;
  },

  submitForApproval: async (courseId: number): Promise<CourseResponse> => {
    const response = await api.post(`/courses/${courseId}/submit`);
    return response.data;
  },

  addQuestion: async (moduleId: number, payload: QuestionCreatePayload): Promise<QuestionPoolItem> => {
    const response = await api.post(`/modules/${moduleId}/questions`, payload);
    return response.data;
  },

  getModuleQuestions: async (moduleId: number): Promise<QuestionPoolItem[]> => {
    const response = await api.get(`/modules/${moduleId}/questions`);
    return response.data;
  },

  getStudentQuizQuestions: async (moduleId: number): Promise<QuizQuestion[]> => {
    const response = await api.get(`/modules/${moduleId}/quiz/questions`);
    return response.data;
  },

  submitQuizRound: async (payload: QuizRoundPayload): Promise<QuizRoundResult> => {
    const response = await api.post('/quiz/round', payload);
    return response.data;
  },

  submitQuiz: async (payload: QuizSubmitPayload): Promise<QuizSubmitResult> => {
    const response = await api.post('/quiz/submit', payload);
    return response.data;
  },

  getMySkills: async (): Promise<UserSkillLevel[]> => {
    const response = await api.get('/skills/me');
    return response.data;
  },
};

export const leaderboardApi = {
  getLeaderboard: async (page = 0, size = 10): Promise<PagedResponse<LeaderboardEntry>> => {
    const response = await api.get('/leaderboard', { params: { page, size } });
    return response.data;
  },

  getStreakBoard: async (page = 0, size = 10): Promise<PagedResponse<StreakBoardEntry>> => {
    const response = await api.get('/leaderboard/streaks', { params: { page, size } });
    return response.data;
  },

  getMyStreak: async (): Promise<StreakSummary> => {
    const response = await api.get('/leaderboard/streaks/me');
    return response.data;
  },
};
