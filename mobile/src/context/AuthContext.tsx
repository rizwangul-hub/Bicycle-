import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { authService } from '@/services/auth.service';

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────
export interface Shop {
  id:   string;
  name: string;
  code: string;
}

export interface AuthUser {
  id:          string;
  name:        string;
  email:       string;
  role:        'SHOP_USER' | 'ADMIN';
  shop:        Shop | null;
  isActive:    boolean;
  lastLoginAt: string | null;
}

interface AuthContextValue {
  user:            AuthUser | null;
  token:           string | null;
  isLoading:       boolean;
  isAuthenticated: boolean;
  login:           (email: string, password: string) => Promise<void>;
  logout:          () => Promise<void>;
}

// ─────────────────────────────────────────────────────────
// Secure token storage
// Web uses localStorage as a fallback (not recommended for prod web)
// Native uses expo-secure-store (Keychain / Keystore)
// ─────────────────────────────────────────────────────────
const TOKEN_KEY = 'pixx_auth_token';

const storage = {
  save: async (token: string) => {
    if (Platform.OS === 'web') {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    }
  },
  get: async (): Promise<string | null> => {
    if (Platform.OS === 'web') {
      return localStorage.getItem(TOKEN_KEY);
    }
    return SecureStore.getItemAsync(TOKEN_KEY);
  },
  delete: async () => {
    if (Platform.OS === 'web') {
      localStorage.removeItem(TOKEN_KEY);
    } else {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
  },
};

// ─────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextValue | null>(null);

// ─────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user,      setUser]      = useState<AuthUser | null>(null);
  const [token,     setToken]     = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ── Restore session on app launch ─────────────────────
  useEffect(() => {
    const restore = async () => {
      try {
        const stored = await storage.get();
        if (!stored) return;

        // Validate token by calling /api/auth/me
        const me = await authService.getMe(stored);
        setToken(stored);
        setUser(me);
      } catch {
        // Token invalid or expired — clear storage
        await storage.delete();
      } finally {
        setIsLoading(false);
      }
    };
    restore();
  }, []);

  // ── Login ─────────────────────────────────────────────
  const login = useCallback(async (email: string, password: string) => {
    const { token: newToken, user: newUser } = await authService.login(email, password);
    await storage.save(newToken);
    setToken(newToken);
    setUser(newUser);
  }, []);

  // ── Logout ────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      if (token) await authService.logout(token);
    } catch {
      // Continue logout even if server call fails
    } finally {
      await storage.delete();
      setToken(null);
      setUser(null);
    }
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
