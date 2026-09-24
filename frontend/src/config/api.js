/**
 * API Configuration — Pixx Bicycle Owner's Declaration
 * Connected to live production backend on Vercel
 */
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'https://bicycle-flax-chi.vercel.app/api';

export const ENDPOINTS = {
  HEALTH: '/health',
  AUTH: {
    LOGIN: '/auth/login',
    ME: '/auth/me',
  },
  DECLARATIONS: {
    LIST: '/declarations',
    CREATE: '/declarations',
    DETAIL: (id) => `/declarations/${id}`,
    UPDATE: (id) => `/declarations/${id}`,
    DELETE: (id) => `/declarations/${id}`,
    CERTIFICATE: (id) => `/declarations/${id}/certificate`,
  },
  UPLOADS: {
    DECLARATION: (id) => `/uploads/declaration/${id}`,
    DELETE: (id) => `/uploads/${id}`,
  },
  ADMIN: {
    DASHBOARD: '/admin/dashboard',
    SHOPS: '/admin/shops',
    USERS: '/admin/users',
    USER_DETAIL: (id) => `/admin/users/${id}`,
    USER_STATUS: (id) => `/admin/users/${id}/status`,
    USER_PASSWORD: (id) => `/admin/users/${id}/password`,
  },
};
