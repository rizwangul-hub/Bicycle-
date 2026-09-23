/**
 * Base type definitions for the Pixx Bicycle Owner's Declaration System.
 * Phase 1: Foundation types only.
 * Phase 2+: Expanded with full form types, auth types, etc.
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
  // passwordHash is NEVER included in API responses
}

// ── Declaration Attachments ──────────────────────────────
export type AttachmentCategory = 'BICYCLE' | 'CUSTOMER' | 'ID' | 'ADDITIONAL';

export interface Attachment {
  _id: string;
  declarationId: string;
  shopId: string;
  uploadedBy: string | User;
  category: AttachmentCategory;
  originalFileName: string;
  fileName: string;
  mimeType: string;
  fileType: 'image' | 'document';
  fileSize: number;
  storageUrl: string;
  storagePublicId: string;
  createdAt: string;
  updatedAt: string;
}

export interface GroupedAttachments {
  BICYCLE: Attachment[];
  CUSTOMER: Attachment[];
  ID: Attachment[];
  ADDITIONAL: Attachment[];
}

export interface DeclarationAttachmentsResponse {
  declarationId: string;
  totalAttachments: number;
  grouped: GroupedAttachments;
}

export interface DeclarationAttachments {
  bicyclePhotos:       string[];
  customerPhotos:      string[];
  idPhotos:            string[];
  additionalDocuments: string[];
}

// ── Declaration ───────────────────────────────────────────
export interface Declaration {
  _id: string;
  shopId: string | Shop;

  // Customer
  customerName:       string;    // required
  date?:              string;
  address?:           string;
  phone?:             string;
  cashPurchasePageNo?: string;
  email?:             string;
  mobile?:            string;
  postcode?:          string;
  signature?:         string;
  sellerSignature?:   string;

  // Bicycle
  bicycleMake?:             string;
  bicycleModel:             string; // required
  bicycleColour?:           string;
  frameNumber?:             string;
  distinguishingMarkings?:  string;
  bicycleSource?:           string;
  ownershipDuration?:       string;
  bicycleCost?:             string;
  bicycleFault?:            string;

  // Legal
  legalOwnerConfirmed: boolean;

  // Attachments
  attachments: DeclarationAttachments;

  // Meta
  createdBy?: string | User;
  createdAt:  string;
  updatedAt:  string;
}

// ── API Response wrapper ──────────────────────────────────
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
