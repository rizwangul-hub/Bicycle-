/**
 * Upload & Attachment Service — Frontend Web
 */
import { API_BASE_URL, ENDPOINTS } from '../config/api';
import { authService } from './auth.service';

export const uploadService = {
  /**
   * Upload files under a category (BICYCLE, CUSTOMER, ID, ADDITIONAL)
   * @param {string} declarationId
   * @param {'BICYCLE'|'CUSTOMER'|'ID'|'ADDITIONAL'} category
   * @param {File[]} files
   */
  uploadAttachments: async (declarationId, category, files) => {
    if (!files || files.length === 0) return [];

    const formData = new FormData();
    formData.append('category', category);

    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    const token = authService.getToken();
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(
      `${API_BASE_URL}${ENDPOINTS.UPLOADS.DECLARATION(declarationId)}`,
      {
        method: 'POST',
        headers,
        body: formData,
      }
    );

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || `Failed to upload ${category} attachments.`);
    }
    return data.data;
  },

  /**
   * Get all attachments for a declaration grouped by category
   */
  getDeclarationAttachments: async (declarationId) => {
    const token = authService.getToken();
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(
      `${API_BASE_URL}${ENDPOINTS.UPLOADS.DECLARATION(declarationId)}`,
      { headers }
    );

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to fetch declaration attachments.');
    }
    return data.data; // { declarationId, totalAttachments, grouped: { BICYCLE: [], CUSTOMER: [], ID: [], ADDITIONAL: [] } }
  },

  /**
   * Delete single attachment by ID
   */
  deleteAttachment: async (attachmentId) => {
    const token = authService.getToken();
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.UPLOADS.DELETE(attachmentId)}`, {
      method: 'DELETE',
      headers,
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to delete attachment.');
    }
    return data;
  },
};
