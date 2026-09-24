/**
 * API Configuration — Pixx Bicycle Owner's Declaration
 */
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'https://bicycle-flax-chi.vercel.app/api';

export const ENDPOINTS = {
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
};
