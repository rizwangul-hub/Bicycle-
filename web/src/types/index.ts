/**
 * Base type definitions — Admin Web Dashboard
 * Pixx Bicycle Owner's Declaration System
 * Mirrors the mobile types and backend models.
 */

// ── Shops ─────────────────────────────────────────────────
export type ShopCode =
  | 'STATION'
  | 'CAMDEN'
  | 'CHELSEA'
  | 'EDGWARE'
  | 'SOUTHWARK'
  | 'LEEBRIDGE';

export interface Shop {
  _id: string;
  name: string;
  code: ShopCode;
  address?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Users ─────────────────────────────────────────────────
export type UserRole = 'SHOP_USER' | 'ADMIN';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  shopId?: string | Shop;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Declaration ───────────────────────────────────────────
export interface DeclarationAttachments {
  bicyclePhotos: string[];
  customerPhotos: string[];
  idPhotos: string[];
  additionalDocuments: string[];
}

export interface Declaration {
  _id: string;
  shopId: string | Shop;
  customerName: string;
  date?: string;
  address?: string;
  phone?: string;
  cashPurchasePageNo?: string;
  email?: string;
  mobile?: string;
  postcode?: string;
  signature?: string;
  sellerSignature?: string;
  bicycleMake?: string;
  bicycleModel: string;
  bicycleColour?: string;
  frameNumber?: string;
  distinguishingMarkings?: string;
  bicycleSource?: string;
  ownershipDuration?: string;
  bicycleCost?: string;
  bicycleFault?: string;
  legalOwnerConfirmed: boolean;
  attachments: DeclarationAttachments;
  createdBy?: string | User;
  createdAt: string;
  updatedAt: string;
}

// ── API Response ──────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: string[];
}

// ── Auth (Phase 2) ─────────────────────────────────────────
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
