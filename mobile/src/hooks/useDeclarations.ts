import { useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import declarationService, { CreateDeclarationInput } from '@/services/declaration.service';
import type { Declaration } from '@/types';

export interface DeclarationListMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function useDeclarations() {
  const { token, logout } = useAuth();

  const [declarations, setDeclarations] = useState<Declaration[]>([]);
  const [meta, setMeta]                 = useState<DeclarationListMeta | null>(null);
  const [isLoading, setIsLoading]       = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError]               = useState<string | null>(null);

  const handleAuthError = useCallback(
    (err: unknown) => {
      const e = err as { statusCode?: number; message?: string };
      if (e?.statusCode === 401 || e?.message?.includes('401') || e?.message?.includes('Unauthorized')) {
        logout();
        return true;
      }
      return false;
    },
    [logout]
  );

  const fetchDeclarations = useCallback(
    async (search?: string, page = 1, append = false) => {
      if (!token) return;
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      try {
        const res = await declarationService.list(token, { search, page, limit: 20 });
        if (append) {
          setDeclarations((prev) => [...prev, ...(res.data ?? [])]);
        } else {
          setDeclarations(res.data ?? []);
        }
        setMeta(res.pagination ?? null);
      } catch (err) {
        if (!handleAuthError(err)) {
          setError('Failed to load declarations. Please try again.');
        }
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [token, handleAuthError]
  );

  const loadMore = useCallback(
    async (search?: string) => {
      if (!meta || meta.page >= meta.totalPages || isLoading || isLoadingMore) {
        return;
      }
      await fetchDeclarations(search, meta.page + 1, true);
    },
    [meta, isLoading, isLoadingMore, fetchDeclarations]
  );

  const createDeclaration = useCallback(
    async (input: CreateDeclarationInput): Promise<Declaration | null> => {
      if (!token) return null;
      setError(null);
      try {
        const created = await declarationService.create(input, token);
        return created;
      } catch (err) {
        if (!handleAuthError(err)) {
          const e = err as Error;
          throw new Error(e.message || 'Failed to create declaration.');
        }
        return null;
      }
    },
    [token, handleAuthError]
  );

  const getDeclarationById = useCallback(
    async (id: string): Promise<Declaration | null> => {
      if (!token) return null;
      try {
        return await declarationService.getById(id, token);
      } catch (err) {
        if (!handleAuthError(err)) {
          const e = err as Error;
          throw new Error(e.message || 'Failed to load declaration.');
        }
        return null;
      }
    },
    [token, handleAuthError]
  );

  const updateDeclaration = useCallback(
    async (id: string, input: Partial<CreateDeclarationInput>): Promise<Declaration | null> => {
      if (!token) return null;
      try {
        const updated = await declarationService.update(id, input, token);
        setDeclarations((prev) =>
          prev.map((item) => (item._id === id ? updated : item))
        );
        return updated;
      } catch (err) {
        if (!handleAuthError(err)) {
          const e = err as Error;
          throw new Error(e.message || 'Failed to update declaration.');
        }
        return null;
      }
    },
    [token, handleAuthError]
  );

  const deleteDeclaration = useCallback(
    async (id: string): Promise<boolean> => {
      if (!token) return false;
      try {
        await declarationService.delete(id, token);
        setDeclarations((prev) => prev.filter((item) => item._id !== id));
        return true;
      } catch (err) {
        if (!handleAuthError(err)) {
          const e = err as Error;
          throw new Error(e.message || 'Failed to delete declaration.');
        }
        return false;
      }
    },
    [token, handleAuthError]
  );

  return {
    declarations,
    meta,
    isLoading,
    isLoadingMore,
    error,
    fetchDeclarations,
    loadMore,
    createDeclaration,
    getDeclarationById,
    updateDeclaration,
    deleteDeclaration,
  };
}
