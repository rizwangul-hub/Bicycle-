import { BASE_URL, ENDPOINTS } from '../config/api';

/**
 * Generic API fetch helper with token support
 */
export const apiRequest = async (path, options = {}) => {
  const { token, body, headers: extraHeaders, ...rest } = options;

  const headers = {
    'Content-Type': 'application/json',
    ...(extraHeaders || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data?.message || 'Request failed');
    error.statusCode = response.status;
    throw error;
  }

  return data;
};

export const authService = {
  login: async (email, password) => {
    return apiRequest(ENDPOINTS.AUTH.LOGIN, {
      method: 'POST',
      body: { email, password },
    });
  },

  getMe: async (token) => {
    const res = await apiRequest(ENDPOINTS.AUTH.ME, {
      method: 'GET',
      token,
    });
    return res.user;
  },

  logout: async (token) => {
    try {
      await apiRequest(ENDPOINTS.AUTH.LOGOUT, {
        method: 'POST',
        token,
      });
    } catch {
      // Allow logout to proceed regardless
    }
  },
};

export default authService;
