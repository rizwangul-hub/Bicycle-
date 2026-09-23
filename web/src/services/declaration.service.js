import { apiRequest } from './auth.service';
import { BASE_URL, ENDPOINTS } from '../config/api';

export const declarationService = {
  /**
   * GET /api/admin/dashboard
   * Returns dashboard overview statistics and per-shop declaration counts.
   */
  getDashboardStats: async (token) => {
    const res = await apiRequest(ENDPOINTS.ADMIN.DASHBOARD, { token });
    return res.dashboard;
  },

  /**
   * GET /api/declarations
   * Retrieve paginated declarations. When ADMIN is logged in, can filter by shopId and bike details.
   */
  getDeclarations: async (token, params = {}) => {
    const query = new URLSearchParams();
    if (params.page)          query.set('page', String(params.page));
    if (params.limit)         query.set('limit', String(params.limit));
    if (params.search)        query.set('search', params.search);
    if (params.shopId)        query.set('shopId', params.shopId);
    if (params.bicycleMake)   query.set('bicycleMake', params.bicycleMake);
    if (params.bicycleModel)  query.set('bicycleModel', params.bicycleModel);
    if (params.bicycleColour) query.set('bicycleColour', params.bicycleColour);
    if (params.date)          query.set('date', params.date);
    if (params.sortBy)        query.set('sortBy', params.sortBy);
    if (params.sortOrder)     query.set('sortOrder', params.sortOrder);

    const qs = query.toString();
    const path = `${ENDPOINTS.DECLARATIONS}${qs ? `?${qs}` : ''}`;
    return apiRequest(path, { token });
  },

  /**
   * GET /api/declarations/:id
   * Retrieve single declaration by ID with populated shop details.
   */
  getDeclarationById: async (token, id) => {
    const res = await apiRequest(ENDPOINTS.DECLARATION_DETAIL(id), { token });
    return res.data;
  },

  /**
   * PUT /api/declarations/:id
   * Update declaration details (Admin or shop user for own shop).
   */
  updateDeclaration: async (token, id, data) => {
    return apiRequest(ENDPOINTS.DECLARATION_DETAIL(id), {
      method: 'PUT',
      token,
      body: data,
    });
  },

  /**
   * DELETE /api/declarations/:id
   * Delete declaration and associated attachments.
   */
  deleteDeclaration: async (token, id) => {
    return apiRequest(ENDPOINTS.DECLARATION_DETAIL(id), {
      method: 'DELETE',
      token,
    });
  },

  /**
   * GET /api/uploads/declaration/:declarationId
   * Retrieve all attachments grouped by category (BICYCLE, CUSTOMER, ID, ADDITIONAL).
   */
  getAttachments: async (token, declarationId) => {
    const res = await apiRequest(ENDPOINTS.ATTACHMENTS.BY_DECLARATION(declarationId), { token });
    return res.data;
  },

  /**
   * DELETE /api/uploads/:attachmentId
   * Delete an attachment.
   */
  deleteAttachment: async (token, attachmentId) => {
    return apiRequest(ENDPOINTS.ATTACHMENTS.DETAIL(attachmentId), {
      method: 'DELETE',
      token,
    });
  },

  /**
   * Download individual attachment file securely.
   */
  downloadAttachment: async (token, attachmentId, originalFileName) => {
    const url = `${BASE_URL}${ENDPOINTS.ATTACHMENTS.DOWNLOAD_ONE(attachmentId)}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      throw new Error('Download failed');
    }
    const blob = await res.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = originalFileName || `attachment-${attachmentId}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(downloadUrl);
  },

  /**
   * Download all declaration attachments packed in a ZIP file.
   */
  downloadAllAttachments: async (token, declarationId, frameNumber) => {
    const url = `${BASE_URL}${ENDPOINTS.ATTACHMENTS.DOWNLOAD_ALL(declarationId)}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'ZIP generation failed');
    }
    const blob = await res.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `Declaration_${frameNumber || declarationId}_Attachments.zip`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(downloadUrl);
  },

  /**
   * GET /api/admin/shops
   * Retrieve list of all 6 shops with declaration and user counts.
   */
  getShops: async (token) => {
    const res = await apiRequest(ENDPOINTS.ADMIN.SHOPS, { token });
    return res.shops;
  },

  /**
   * GET /api/admin/users
   * Retrieve all users across all shops.
   */
  getUsers: async (token) => {
    const res = await apiRequest(ENDPOINTS.ADMIN.USERS, { token });
    return res.users;
  },

  /**
   * POST /api/admin/users
   * Admin creates a new shop user or admin.
   */
  createUser: async (token, userData) => {
    return apiRequest(ENDPOINTS.ADMIN.USERS, {
      method: 'POST',
      token,
      body: userData,
    });
  },

  /**
   * PUT /api/admin/users/:id
   * Admin updates a user.
   */
  updateUser: async (token, id, data) => {
    return apiRequest(ENDPOINTS.ADMIN.USER_DETAIL(id), {
      method: 'PUT',
      token,
      body: data,
    });
  },

  /**
   * PATCH /api/admin/users/:id/status
   * Activate or deactivate a user account.
   */
  toggleUserStatus: async (token, id, isActive) => {
    return apiRequest(ENDPOINTS.ADMIN.USER_STATUS(id), {
      method: 'PATCH',
      token,
      body: { isActive },
    });
  },

  /**
   * PATCH /api/admin/users/:id/password
   * Reset user password.
   */
  resetUserPassword: async (token, id, password) => {
    return apiRequest(ENDPOINTS.ADMIN.USER_PASSWORD(id), {
      method: 'PATCH',
      token,
      body: { password },
    });
  },
};

export default declarationService;
