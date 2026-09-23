/**
 * Upload & Attachment Service — Mobile App
 * Pixx Bicycle Owner's Declaration System
 *
 * Connects directly to Phase 4 backend endpoints:
 *  - POST   /api/uploads/declaration/:declarationId (multipart/form-data)
 *  - GET    /api/uploads/declaration/:declarationId (grouped by category)
 *  - DELETE /api/uploads/:attachmentId
 */

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

    files.forEach((file, index) => {
      const uri = file.uri;
      let filename = file.name || uri.split('/').pop() || `upload_${Date.now()}_${index}.jpg`;
      
      // Fallback mime type detection
      let mime = file.mimeType || 'image/jpeg';
      if (!file.mimeType) {
        const lower = filename.toLowerCase();
        if (lower.endsWith('.png')) mime = 'image/png';
        else if (lower.endsWith('.webp')) mime = 'image/webp';
        else if (lower.endsWith('.pdf')) mime = 'application/pdf';
        else mime = 'image/jpeg';
      }

      // Append in React Native format
      // @ts-expect-error React Native FormData accepts an object with { uri, name, type }
      formData.append('files', {
        uri,
        name: filename,
        type: mime,
      });
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(
        `${BASE_URL}${ENDPOINTS.UPLOADS.DECLARATION(declarationId)}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            // Do NOT set Content-Type header; fetch handles boundary automatically
          },
          body: formData,
          signal: controller.signal,
        }
      );

      const json = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(json.message || `Upload failed with status ${response.status}`);
      }

      return json.data;
    } catch (err: unknown) {
      const error = err as Error;
      if (error.name === 'AbortError') {
        throw new Error('Upload timed out. Please check your connection and retry.');
      }
      if (error.message?.includes('Network request failed')) {
        throw new Error('Unable to upload. Please check your internet connection.');
      }
      throw error;
    } finally {
      clearTimeout(timeout);
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
