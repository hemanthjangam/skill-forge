import api from "./axios"

export interface Doubt {
  id: number
  studentId: number
  studentName: string
  courseId?: number
  courseTitle?: string
  moduleId?: number
  moduleTitle?: string
  concept: string
  question: string
  status: "OPEN" | "RESOLVED"
  resolution?: string
  resolvedByName?: string
  createdAt: string
  resolvedAt?: string
}

export interface SupportBadge {
  badgeCode: "QUICK_LEARNER" | "SEVEN_DAY_STREAK" | "QUIZ_MASTER" | "NIGHT_OWL"
  title: string
  description: string
  awardedAt: string
}

export interface SupportCertificate {
  courseId: number
  courseTitle: string
  certificateCode: string
  issuedAt: string
}

export interface CourseRecommendation {
  courseId: number
  courseTitle: string
  rationale: string
  matchScore: number
}

export interface StudentSupportSummary {
  openDoubts: number
  examsTaken: number
  badges: SupportBadge[]
  certificates: SupportCertificate[]
  recommendations: CourseRecommendation[]
  recentDoubts: Doubt[]
}

export interface ExamSummary {
  examId: number
  courseId: number
  courseTitle: string
  title: string
  description: string
  questionCount: number
  durationMinutes: number
  createdAt: string
}

export interface ExamQuestion {
  id: number
  statement: string
  concept: string
  difficulty: string
  options: string[]
  explanation?: string
  selectedAnswer?: string
  correctAnswer?: string
  correct: boolean
}

export interface ExamStartResponse {
  attemptId: number
  examId: number
  title: string
  durationMinutes: number
  startedAt: string
  questions: ExamQuestion[]
}

export interface ExamSubmitResponse {
  attemptId: number
  examId: number
  examTitle: string
  scorePercentage: number
  correctAnswers: number
  totalQuestions: number
  proctoringScore: number
  violationCount: number
  feedbackSummary: string
  submittedAt: string
  questions: ExamQuestion[]
}

export interface ExamAttemptReview {
  attemptId: number
  examId: number
  examTitle: string
  courseTitle: string
  scorePercentage: number
  correctAnswers: number
  totalQuestions: number
  proctoringScore: number
  violationCount: number
  startedAt: string
  submittedAt: string
  questions: ExamQuestion[]
}

export interface ExamGeneratePayload {
  title?: string
  description?: string
  questionCount?: number
  durationMinutes?: number
}

export interface ProctorEventPayload {
  eventType: "FULLSCREEN_EXIT" | "TAB_SWITCH" | "KEYBOARD_SHORTCUT" | "FACE_MISSING" | "MULTIPLE_FACES" | "OBJECT_DETECTED" | "HEAD_MOVEMENT" | "MOTION_ALERT"
  severity: "LOW" | "MEDIUM" | "HIGH"
  details?: string
}

export const supportApi = {
  getSummary: async (): Promise<StudentSupportSummary> => {
    const response = await api.get("/student/support/summary")
    return response.data
  },

  createDoubt: async (payload: { courseId?: number; moduleId?: number; concept: string; question: string }): Promise<Doubt> => {
    const response = await api.post("/doubts", payload)
    return response.data
  },

  getMyDoubts: async (): Promise<Doubt[]> => {
    const response = await api.get("/doubts/me")
    return response.data
  },

  getOpenDoubts: async (): Promise<Doubt[]> => {
    const response = await api.get("/doubts/open")
    return response.data
  },

  resolveDoubt: async (doubtId: number, resolution: string): Promise<Doubt> => {
    const response = await api.patch(`/doubts/${doubtId}/resolve`, { resolution })
    return response.data
  },

  getCourseExams: async (courseId: number): Promise<ExamSummary[]> => {
    const response = await api.get(`/courses/${courseId}/exams`)
    return response.data
  },

  getTrainerExams: async (): Promise<ExamSummary[]> => {
    const response = await api.get("/trainer/exams")
    return response.data
  },

  generateExam: async (courseId: number, payload: ExamGeneratePayload): Promise<ExamSummary> => {
    const response = await api.post(`/trainer/courses/${courseId}/exams/generate`, payload)
    return response.data
  },

  startExam: async (examId: number): Promise<ExamStartResponse> => {
    const response = await api.post(`/exams/${examId}/attempts/start`)
    return response.data
  },

  recordProctorEvent: async (attemptId: number, payload: ProctorEventPayload): Promise<void> => {
    await api.post(`/exam-attempts/${attemptId}/proctor-events`, payload)
  },

  submitExam: async (attemptId: number, payload: { answers: { questionId: number; selectedAnswer: string }[] }): Promise<ExamSubmitResponse> => {
    const response = await api.post(`/exam-attempts/${attemptId}/submit`, payload)
    return response.data
  },

  getAttemptReview: async (attemptId: number): Promise<ExamAttemptReview> => {
    const response = await api.get(`/exam-attempts/${attemptId}`)
    return response.data
  },
}
