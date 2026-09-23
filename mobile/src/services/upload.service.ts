/**
 * Upload & Attachment Service — Mobile App
 * Pixx Bicycle Owner's Declaration System
 *
 * Connects directly to Phase 4 backend endpoints:
 *  - POST   /api/uploads/declaration/:declarationId (multipart/form-data)
 *  - GET    /api/uploads/declaration/:declarationId (grouped by category)
 *  - DELETE /api/uploads/:attachmentId
 */

import axios from 'axios';
import { BASE_URL, ENDPOINTS } from '@/constants/api';
import type {
  Attachment,
  AttachmentCategory,
  DeclarationAttachmentsResponse,
} from '@/types';

export interface LocalPickedFile {
  uri: string;
  name?: string | null;
  mimeType?: string | null;
  size?: number;
}

export interface UploadSuccessResponse {
  success: boolean;
  message: string;
  count: number;
  data: Attachment[];
}

export interface GetAttachmentsResponse {
  success: boolean;
  data: DeclarationAttachmentsResponse;
}

export interface DeleteAttachmentResponse {
  success: boolean;
  message: string;
  attachmentId?: string;
}

const REQUEST_TIMEOUT_MS = 60_000; // 60s for image uploads

export const uploadService = {
  /**
   * GET /api/uploads/declaration/:declarationId
   * Retrieve all attachments grouped by category (BICYCLE, CUSTOMER, ID, ADDITIONAL).
   */
  getAttachments: async (
    declarationId: string,
    token: string
  ): Promise<DeclarationAttachmentsResponse> => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);

    try {
      const response = await fetch(
        `${BASE_URL}${ENDPOINTS.UPLOADS.DECLARATION(declarationId)}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        }
      );

      const json = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(json.message || `Failed to fetch attachments (${response.status})`);
      }

      return json.data;
    } catch (err: unknown) {
      const error = err as Error;
      if (error.name === 'AbortError') {
        throw new Error('Connection timed out while fetching attachments.');
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  },

  /**
   * POST /api/uploads/declaration/:declarationId
   * Upload multiple files under a specific category using multipart/form-data.
   */
  uploadAttachments: async (
    declarationId: string,
    category: AttachmentCategory,
    files: LocalPickedFile[],
    token: string
  ): Promise<Attachment[]> => {
    if (!files || files.length === 0) {
      throw new Error('Please select at least one file to upload.');
    }

    const formData = new FormData();
    formData.append('category', category);

    for (let index = 0; index < files.length; index++) {
      const file = files[index];
      const uri = file.uri;
      const filename = file.name || uri.split('/').pop() || `upload_${Date.now()}_${index}.jpg`;
      
      // Fallback mime type detection
      let mime = file.mimeType || 'image/jpeg';
      if (!file.mimeType) {
        const lower = filename.toLowerCase();
        if (lower.endsWith('.png')) mime = 'image/png';
        else if (lower.endsWith('.webp')) mime = 'image/webp';
        else if (lower.endsWith('.pdf')) mime = 'application/pdf';
        else mime = 'image/jpeg';
      }

      // Native React Native FormData format — natively processed by Axios / XHR NetworkingModule
      // @ts-expect-error React Native native FormData format
      formData.append('files', {
        uri,
        name: filename,
        type: mime,
      });
    }

    try {
      // Axios utilizes React Native's native XMLHttpRequest network stack (RCTNetworking / NetworkingModule)
      // avoiding Expo fetch WinterCG FormDataPart serialization issues and File getter limitations
      const response = await axios.post(
        `${BASE_URL}${ENDPOINTS.UPLOADS.DECLARATION(declarationId)}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
          timeout: REQUEST_TIMEOUT_MS,
        }
      );

      return response.data?.data;
    } catch (err: any) {
      if (err.code === 'ECONNABORTED') {
        throw new Error('Upload timed out. Please check your connection and retry.');
      }
      const serverMessage = err.response?.data?.message;
      if (serverMessage) {
        throw new Error(serverMessage);
      }
      if (err.message?.includes('Network Error')) {
        throw new Error('Unable to upload. Please check your internet connection.');
      }
      throw new Error(err.message || 'Upload failed');
    }
  },

  /**
   * DELETE /api/uploads/:attachmentId
   * Delete an attachment from Cloudinary and database.
   */
  deleteAttachment: async (
    attachmentId: string,
    token: string
  ): Promise<DeleteAttachmentResponse> => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);

    try {
      const response = await fetch(
        `${BASE_URL}${ENDPOINTS.UPLOADS.ATTACHMENT(attachmentId)}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        }
      );

      const json = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(json.message || `Failed to delete attachment (${response.status})`);
      }

      return json;
    } catch (err: unknown) {
      const error = err as Error;
      if (error.name === 'AbortError') {
        throw new Error('Connection timed out while deleting attachment.');
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  },
};

export default uploadService;
