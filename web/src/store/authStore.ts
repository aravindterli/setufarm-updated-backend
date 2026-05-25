import { create } from 'zustand';
import apiClient from '../api/client';
import type { User, Role, AuthResponse } from '../types';

interface AuthStore {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  sendOtp: (email: string) => Promise<void>;
  verifyOtp: (email: string, otp: string, role: Role) => Promise<void>;
  setUser: (user: User | null) => void;
  logout: () => void;
  loadAuth: () => void;
  refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  isLoading: false,

  sendOtp: async (email) => {
    set({ isLoading: true });
    try {
      await apiClient.post('/auth/send-otp', { email });
    } finally {
      set({ isLoading: false });
    }
  },

  verifyOtp: async (email, otp, role) => {
    set({ isLoading: true });
    try {
      const { data } = await apiClient.post<AuthResponse>('/auth/verify-otp', { email, otp, role });
      localStorage.setItem('auth_token', data.access_token);
      localStorage.setItem('auth_user', JSON.stringify(data.user));
      set({ token: data.access_token, user: data.user });
    } finally {
      set({ isLoading: false });
    }
  },

  setUser: (user) => {
    if (user) localStorage.setItem('auth_user', JSON.stringify(user));
    set({ user });
  },

  logout: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    set({ user: null, token: null });
  },

  loadAuth: () => {
    const token = localStorage.getItem('auth_token');
    const userStr = localStorage.getItem('auth_user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as User;
        set({ token, user });
      } catch {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      }
    }
  },

  refreshUser: async () => {
    try {
      const { data } = await apiClient.get<User>('/users/me');
      localStorage.setItem('auth_user', JSON.stringify(data));
      set({ user: data });
    } catch {
      // silently fail
    }
  },
}));
