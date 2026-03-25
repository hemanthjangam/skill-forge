import api from './axios';
import type { LoginResponse, RegisterResponse } from '../types/auth';

export const authApi = {
  register: async (data: import('../types/auth').RegisterRequest): Promise<RegisterResponse> => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  requestLoginOtp: async (email: string) => {
    const response = await api.post('/auth/login/otp/request', { email });
    return response.data;
  },

  verifyLoginOtp: async (email: string, otp: string): Promise<LoginResponse> => {
    const response = await api.post('/auth/login/otp/verify', { email, otp });
    return response.data;
  },

  requestForgotPasswordOtp: async (email: string) => {
    const response = await api.post('/auth/password/forgot/request', { email });
    return response.data;
  },

  resetPassword: async (email: string, otp: string, newPassword: string) => {
    const response = await api.post('/auth/password/forgot/reset', { email, otp, newPassword });
    return response.data;
  }
};
