export type Role = "STUDENT" | "TRAINER" | "ADMIN";

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export interface LoginResponse {
  token: string;
  tokenType: string;
  userId: number;
  name: string;
  email: string;
  role: Role;
  status: string;
}

export interface RegisterResponse {
  id: number;
  name: string;
  email: string;
  role: Role;
  status: string;
  createdAt: string;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: Role;
  educationLevel?: string;
  learningGoal?: string;
  specialization?: string;
  bio?: string;
}
