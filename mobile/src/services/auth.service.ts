/**
 * Auth Service — Mobile App
 * Pixx Bicycle Owner's Declaration System
 *
 * Handles login, session restoration, and logout
 * by calling the backend API.
 */

import { apiRequest } from './api.service';
import type { AuthUser } from '@/context/AuthContext';

interface LoginResponse {
  success: boolean;
  token:   string;
  user:    AuthUser;
}

interface MeResponse {
  success: boolean;
  user:    AuthUser;
}

export const authService = {
  /**
   * POST /api/auth/login
   * Authenticate with email and password.
   * Returns token + user (no passwordHash).
   */
  login: async (email: string, password: string): Promise<{ token: string; user: AuthUser }> => {
    const res = await apiRequest<LoginResponse>('/auth/login', {
      method: 'POST',
      body:   { email, password },
    });
    return { token: res.token, user: res.user };
  },

  /**
   * GET /api/auth/me
   * Restore session by validating stored token.
   * Returns the current user's safe profile.
   */
  getMe: async (token: string): Promise<AuthUser> => {
    const res = await apiRequest<MeResponse>('/auth/me', { token });
    return res.user;
  },

  /**
   * POST /api/auth/logout
   * Server-side logout acknowledgement.
   * The caller must also clear the local token.
   */
  logout: async (token: string): Promise<void> => {
    await apiRequest('/auth/logout', { method: 'POST', token });
  },
};

export default authService;
