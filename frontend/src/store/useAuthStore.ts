import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Role } from '../types/auth';

interface AuthState {
  user: User | null;
  token: string | null;
  role: Role | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      role: null,
      isAuthenticated: false,
      setAuth: (user, token) => set({ user, token, role: user.role, isAuthenticated: true }),
      logout: () => set({ user: null, token: null, role: null, isAuthenticated: false }),
    }),
    {
      name: 'skillforge-auth', // name of item in the storage (must be unique)
    }
  )
);
