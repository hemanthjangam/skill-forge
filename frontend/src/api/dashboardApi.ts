import api from './axios';

export interface StudentDashboard {
  enrolledCourses: number;
  quizAttempts: number;
  averageQuizScore: number;
  unreadNotifications: number;
  currentStreak: number;
  bestStreak: number;
  knowledgeChecksCompleted: number;
  totalPoints: number;
}

export interface StudentActivityPoint {
  date: string;
  knowledgeChecks: number;
  averageScore: number;
}

export interface TrainerDashboard {
  createdCourses: number;
  pendingCourseApprovals: number;
  totalEnrollments: number;
  questionsCreated: number;
  quizAttemptsOnTrainerModules: number;
}

export interface AdminDashboard {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  pendingTrainerApprovals: number;
  pendingCourseApprovals: number;
  approvedCourses: number;
}

export const dashboardApi = {
  getStudentDashboard: async (): Promise<StudentDashboard> => {
    const response = await api.get('/dashboard/student');
    return response.data;
  },

  getStudentActivity: async (days = 182): Promise<StudentActivityPoint[]> => {
    const response = await api.get('/dashboard/student/activity', { params: { days } });
    return response.data;
  },

  getTrainerDashboard: async (): Promise<TrainerDashboard> => {
    const response = await api.get('/dashboard/trainer');
    return response.data;
  },

  getAdminDashboard: async (): Promise<AdminDashboard> => {
    const response = await api.get('/dashboard/admin');
    return response.data;
  },
};
