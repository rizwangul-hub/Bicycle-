/**
 * API Configuration
 * Pixx Bicycle Owner's Declaration System — Mobile App
 *
 * Automatically detects whether the app is running on a physical device,
 * Android emulator, or iOS simulator.
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';

const resolveDevApiUrl = (): string => {
  // 1. Explicit environment variable takes highest priority
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // 2. Automatically detect development host machine's IP from Metro bundler
  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants as any).manifest2?.extra?.expoGo?.debuggerHost ??
    (Constants as any).manifest?.debuggerHost;

  if (hostUri && typeof hostUri === 'string') {
    const hostIp = hostUri.split(':')[0];
    if (hostIp && hostIp !== 'localhost' && hostIp !== '127.0.0.1') {
      return `http://${hostIp}:5000/api`;
    }
  }

  // 3. If running on a physical device on local Wi-Fi
  if (Device.isDevice) {
    return 'http://192.168.1.9:5000/api';
  }

  // 4. Android Studio Emulator maps host localhost to 10.0.2.2
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000/api';
  }

  // 5. iOS Simulator / Web localhost
  return 'http://localhost:5000/api';
};

const DEV_API_URL = resolveDevApiUrl();
const PROD_API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://bicycle-flax-chi.vercel.app/api';

export const BASE_URL = __DEV__ ? DEV_API_URL : PROD_API_URL;

/**
 * All API endpoint paths.
 * Import and use these instead of hard-coding URLs in components.
 */
export const ENDPOINTS = {
  // ── Health ──────────────────────────────────────────
  HEALTH: '/health',

  // ── Auth (Phase 2) ───────────────────────────────────
  AUTH: {
    LOGIN:   '/auth/login',
    LOGOUT:  '/auth/logout',
    ME:      '/auth/me',
    REFRESH: '/auth/refresh',
  },

  // ── Declarations (Phase 2) ───────────────────────────
  DECLARATIONS: {
    LIST:   '/declarations',
    CREATE: '/declarations',
    DETAIL: (id: string) => `/declarations/${id}`,
    UPDATE: (id: string) => `/declarations/${id}`,
  },

  // ── Uploads (Phase 4 / Phase 6) ─────────────────────
  UPLOADS: {
    DECLARATION: (declarationId: string) => `/uploads/declaration/${declarationId}`,
    ATTACHMENT:  (attachmentId: string)  => `/uploads/${attachmentId}`,
  },
} as const;

export default { BASE_URL, ENDPOINTS };
