/**
 * Declaration Service — Frontend Web
 */
import { API_BASE_URL, ENDPOINTS } from '../config/api';
import { authService } from './auth.service';

const getHeaders = (isJson = true) => {
  const token = authService.getToken();
  const headers = {};
  if (isJson) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const declarationService = {
  create: async (declarationData) => {
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.DECLARATIONS.CREATE}`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(declarationData),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to create declaration.');
    }
    return data.data;
  },

  list: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));

    const qs = query.toString() ? `?${query.toString()}` : '';
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.DECLARATIONS.LIST}${qs}`, {
      headers: getHeaders(true),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to fetch declarations.');
    }
    return data;
  },

  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.DECLARATIONS.DETAIL(id)}`, {
      headers: getHeaders(true),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Declaration not found.');
    }
    return data.data;
  },

  update: async (id, updateData) => {
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.DECLARATIONS.UPDATE(id)}`, {
      method: 'PUT',
      headers: getHeaders(true),
      body: JSON.stringify(updateData),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to update declaration.');
    }
    return data.data;
  },

  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.DECLARATIONS.DELETE(id)}`, {
      method: 'DELETE',
      headers: getHeaders(true),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to delete declaration.');
    }
    return data;
  },

  getCertificateUrl: (id) => {
    return `${API_BASE_URL}${ENDPOINTS.DECLARATIONS.CERTIFICATE(id)}`;
  },
};
