/**
 * Authentication Service — Frontend Web
 */
import { API_BASE_URL, ENDPOINTS } from '../config/api';

const TOKEN_KEY = 'pixx_bicycle_token';
const USER_KEY = 'pixx_bicycle_user';

export const authService = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  getUser: () => {
    const raw = localStorage.getItem(USER_KEY);
    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  setSession: (token, user) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  clearSession: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  login: async (email, password) => {
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.AUTH.LOGIN}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: email.trim(), password }),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Invalid email or password.');
    }

    authService.setSession(data.token, data.user);
    return data;
  },

  getCurrentUser: async (token) => {
    const activeToken = token || authService.getToken();
    if (!activeToken) throw new Error('No authentication token available.');

    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.AUTH.ME}`, {
      headers: {
        Authorization: `Bearer ${activeToken}`,
      },
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      authService.clearSession();
      throw new Error(data.message || 'Failed to authenticate user.');
    }

    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    return data.user;
  },
};
