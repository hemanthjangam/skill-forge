import api from './axios'

export interface AiChatMessage {
  role: 'assistant' | 'user'
  content: string
}

export interface AiTeachRequest {
  concept: string
  courseId?: number
  moduleId?: number
}

export interface AiTeachResponse {
  concept: string
  courseTitle?: string
  moduleTitle?: string
  summary: string
  intuition: string
  projectApplication: string
  practiceSteps: string[]
  commonMistakes: string[]
  quickChecks: string[]
  nextStep: string
}

export interface AiDoubtRequest extends AiTeachRequest {
  question: string
  history: AiChatMessage[]
}

export interface AiDoubtResponse {
  answer: string
  keyPoints: string[]
  followUpPrompt: string
}

export interface AiFeedbackRequest extends AiTeachRequest {
  reflection: string
}

export interface AiFeedbackResponse {
  verdict: string
  strengths: string[]
  improvements: string[]
  revisedAnswerHint: string
  nextStep: string
}

export interface AiMockGenerateRequest {
  courseIds?: number[]
}

export interface AiMockScenario {
  courseId: number
  courseTitle: string
  focusConcepts: string[]
  prompts: string[]
  evaluationFocus: string
}

export interface AiMockGenerateResponse {
  mocks: AiMockScenario[]
}

export const aiApi = {
  teach: async (payload: AiTeachRequest): Promise<AiTeachResponse> => {
    const response = await api.post('/ai/tutor/teach', payload)
    return response.data
  },

  askDoubt: async (payload: AiDoubtRequest): Promise<AiDoubtResponse> => {
    const response = await api.post('/ai/tutor/doubt', payload)
    return response.data
  },

  getFeedback: async (payload: AiFeedbackRequest): Promise<AiFeedbackResponse> => {
    const response = await api.post('/ai/tutor/feedback', payload)
    return response.data
  },

  generateMocks: async (payload: AiMockGenerateRequest): Promise<AiMockGenerateResponse> => {
    const response = await api.post('/ai/mock/generate', payload)
    return response.data
  },
}
