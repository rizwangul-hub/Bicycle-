/**
 * API Client for the Pixx Bicycle Owner's Declaration System.
 *
 * Provides a generic fetch wrapper that:
 *  - Builds URLs from BASE_URL
 *  - Injects Authorization: Bearer <token> when provided
 *  - Throws meaningful errors from the API response
 */

import { BASE_URL } from '@/constants/api';

const REQUEST_TIMEOUT_MS = 15_000;

interface RequestOptions extends Omit<RequestInit, 'body'> {
  token?: string | null;
  body?:  unknown;
}

/**
 * Generic API request function.
 *
 * @param path     - API path (e.g. '/auth/login')
 * @param options  - fetch options + optional token + typed body
 */
export const apiRequest = async <T = unknown>(
  path: string,
  options: RequestOptions = {}
): Promise<T> => {
  const { token, body, headers: extraHeaders, ...rest } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(extraHeaders as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let response: Response;

  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...rest,
      headers,
      signal: controller.signal,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(
        `Could not reach the API at ${BASE_URL}. Check that the backend is running and that the mobile device uses the correct API URL.`
      );
    }
    throw new Error(
      `Network error while contacting ${BASE_URL}. Check that the backend is running and reachable from the device.`
    );
  } finally {
    clearTimeout(timeout);
  }

  const data = await response.json();

  if (!response.ok) {
    const message = data?.message || `Request failed (${response.status})`;
    const err     = new Error(message) as Error & { statusCode: number };
    err.statusCode = response.status;
    throw err;
  }

  return data as T;
};

/**
 * GET /api/health — verify API is reachable.
 */
export const checkHealth = () => apiRequest('/health');

export default { apiRequest, checkHealth };
