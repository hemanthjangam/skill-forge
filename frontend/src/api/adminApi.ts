import api from './axios';

import type { CourseResponse, PagedResponse } from './courseApi';

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
}

export interface UpdateStatusRequest {
  status: string;
}

export const adminApi = {
  getAllUsers: async (): Promise<AdminUser[]> => {
    const response = await api.get('/users');
    return response.data;
  },

  updateUserStatus: async (id: number, status: string): Promise<AdminUser> => {
    const response = await api.patch(`/users/${id}/status`, { status });
    return response.data;
  },

  getCourses: async (page = 0, size = 10, status?: string): Promise<PagedResponse<CourseResponse>> => {
    const response = await api.get('/admin/courses', { params: { page, size, status } });
    return response.data;
  },

  moderateCourse: async (courseId: number, approved: boolean): Promise<CourseResponse> => {
    const response = await api.patch(`/admin/courses/${courseId}/approval`, { approved });
    return response.data;
  },
};
