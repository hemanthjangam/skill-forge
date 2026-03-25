import api from './axios';

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  educationLevel?: string;
  learningGoal?: string;
  specialization?: string;
  bio?: string;
}

export interface UpdateProfileRequest {
  name?: string;
  email?: string;
  educationLevel?: string;
  learningGoal?: string;
  specialization?: string;
  bio?: string;
}

export const userApi = {
  getMyProfile: async (): Promise<UserProfile> => {
    const response = await api.get('/users/me/profile');
    return response.data;
  },

  updateMyProfile: async (data: UpdateProfileRequest): Promise<UserProfile> => {
    const response = await api.patch('/users/me', data);
    return response.data;
  },
};
