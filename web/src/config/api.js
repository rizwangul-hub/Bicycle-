/**
 * API Configuration
 * Pixx Bicycle Owner's Declaration System — Admin Web Dashboard
 */

const DEV_API_URL  = import.meta.env.VITE_API_URL || 'https://bicycle-flax-chi.vercel.app/api';
const PROD_API_URL = import.meta.env.VITE_API_URL || 'https://bicycle-flax-chi.vercel.app/api';

export const BASE_URL =
  import.meta.env.MODE === 'development' ? DEV_API_URL : PROD_API_URL;

/**
 * All API endpoint paths.
 */
export const ENDPOINTS = {
  HEALTH: '/health',

  AUTH: {
    LOGIN:  '/auth/login',
    LOGOUT: '/auth/logout',
    ME:     '/auth/me',
  },

  SHOPS:        '/shops',
  SHOP_DETAIL:  (id) => `/shops/${id}`,

  USERS:        '/users',
  USER_DETAIL:  (id) => `/users/${id}`,

  DECLARATIONS:        '/declarations',
  DECLARATION_DETAIL:  (id) => `/declarations/${id}`,

  ADMIN: {
    DASHBOARD:    '/admin/dashboard',
    DECLARATIONS: '/admin/declarations',
    SEARCH:       '/admin/search',
    EXPORT:       '/admin/export',
    USERS:        '/admin/users',
    USER_DETAIL:  (id) => `/admin/users/${id}`,
    USER_STATUS:  (id) => `/admin/users/${id}/status`,
    USER_PASSWORD:(id) => `/admin/users/${id}/password`,
    SHOPS:        '/admin/shops',
  },

  ATTACHMENTS: {
    BY_DECLARATION: (declarationId) => `/uploads/declaration/${declarationId}`,
    DOWNLOAD_ALL:   (declarationId) => `/uploads/declaration/${declarationId}/download-all`,
    DOWNLOAD_ONE:   (attachmentId) => `/uploads/${attachmentId}/download`,
    DETAIL:         (attachmentId) => `/uploads/${attachmentId}`,
  },
};

export default { BASE_URL, ENDPOINTS };
