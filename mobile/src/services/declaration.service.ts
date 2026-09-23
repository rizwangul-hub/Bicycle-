/**
 * Declaration Service — Mobile App
 * Pixx Bicycle Owner's Declaration System
 *
 * Handles all declaration API calls:
 *  - create, list, get by ID, search
 */

import { apiRequest } from './api.service';
import { ENDPOINTS } from '@/constants/api';
import type { Declaration } from '@/types';

// ─── Types ────────────────────────────────────────────────
export interface CreateDeclarationInput {
  customerName: string;
  bicycleModel: string;
  date?: string;
  address?: string;
  phone?: string;
  cashPurchasePageNo?: string;
  email?: string;
  mobile?: string;
  postcode?: string;
  bicycleMake?: string;
  bicycleColour?: string;
  frameNumber?: string;
  distinguishingMarkings?: string;
  bicycleSource?: string;
  ownershipDuration?: string;
  bicycleCost?: string;
  bicycleFault?: string;
  legalOwnerConfirmed: boolean;
}

export interface DeclarationListResponse {
  success: boolean;
  count: number;
  data: Declaration[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DeclarationDetailResponse {
  success: boolean;
  data: Declaration;
}

export const declarationService = {
  /**
   * POST /api/declarations
   * Create a new bicycle owner's declaration.
   * shopId is automatically derived from the authenticated user's account.
   */
  create: async (
    input: CreateDeclarationInput,
    token: string
  ): Promise<Declaration> => {
    const res = await apiRequest<DeclarationDetailResponse>(
      ENDPOINTS.DECLARATIONS.CREATE,
      { method: 'POST', body: input, token }
    );
    return res.data!;
  },

  /**
   * GET /api/declarations
   * List declarations for the authenticated user's shop.
   * Supports search, pagination.
   */
  list: async (
    token: string,
    params: { search?: string; page?: number; limit?: number } = {}
  ): Promise<DeclarationListResponse> => {
    const query = new URLSearchParams();
    if (params.search)  query.set('search', params.search);
    if (params.page)    query.set('page',   String(params.page));
    if (params.limit)   query.set('limit',  String(params.limit));

    const path = `${ENDPOINTS.DECLARATIONS.LIST}${query.toString() ? `?${query}` : ''}`;
    return apiRequest<DeclarationListResponse>(path, { token });
  },

  /**
   * GET /api/declarations/:id
   * Retrieve a single declaration by ID.
   */
  getById: async (id: string, token: string): Promise<Declaration> => {
    const res = await apiRequest<DeclarationDetailResponse>(
      ENDPOINTS.DECLARATIONS.DETAIL(id),
      { token }
    );
    return res.data!;
  },

  /**
   * PUT /api/declarations/:id
   * Update declaration fields.
   */
  update: async (
    id: string,
    input: Partial<CreateDeclarationInput>,
    token: string
  ): Promise<Declaration> => {
    const res = await apiRequest<DeclarationDetailResponse>(
      ENDPOINTS.DECLARATIONS.UPDATE(id),
      { method: 'PUT', body: input, token }
    );
    return res.data!;
  },

  /**
   * DELETE /api/declarations/:id
   * Delete declaration.
   */
  delete: async (
    id: string,
    token: string
  ): Promise<{ success: boolean; message: string }> => {
    return apiRequest<{ success: boolean; message: string }>(
      ENDPOINTS.DECLARATIONS.DETAIL(id),
      { method: 'DELETE', token }
    );
  },
};

export default declarationService;
