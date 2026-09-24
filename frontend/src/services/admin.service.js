/**
 * Admin Service — Pixx Bicycle Admin Portal
 */
import { API_BASE_URL, ENDPOINTS } from '../config/api';
import { authService } from './auth.service';

const getHeaders = (isJson = true) => {
  const token = authService.getToken();
  const headers = {};
  if (isJson) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

export const adminService = {
  getDashboardStats: async () => {
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.ADMIN.DASHBOARD}`, {
      headers: getHeaders(true),
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to fetch admin dashboard statistics.');
    }
    return data.dashboard;
  },

  getShops: async () => {
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.ADMIN.SHOPS}`, {
      headers: getHeaders(true),
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to fetch shops.');
    }
    return data.shops || [];
  },

  getUsers: async () => {
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.ADMIN.USERS}`, {
      headers: getHeaders(true),
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to fetch users.');
    }
    return data.users || [];
  },

  createUser: async (userData) => {
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.ADMIN.USERS}`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(userData),
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to create user.');
    }
    return data.user;
  },

  updateUser: async (id, updateData) => {
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.ADMIN.USER_DETAIL(id)}`, {
      method: 'PUT',
      headers: getHeaders(true),
      body: JSON.stringify(updateData),
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to update user.');
    }
    return data.user;
  },

  toggleUserStatus: async (id, isActive) => {
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.ADMIN.USER_STATUS(id)}`, {
      method: 'PATCH',
      headers: getHeaders(true),
      body: JSON.stringify({ isActive }),
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to toggle user status.');
    }
    return data;
  },

  resetUserPassword: async (id, password) => {
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.ADMIN.USER_PASSWORD(id)}`, {
      method: 'PATCH',
      headers: getHeaders(true),
      body: JSON.stringify({ password }),
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to reset password.');
    }
    return data;
  },
};
