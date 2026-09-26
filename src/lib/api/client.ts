import axios from 'axios';
import { appConfig } from '@/lib/config';
import { tokenStorage } from '@/lib/storage';

export const SESSION_EXPIRED_MESSAGE = '未登录或登陆已过期';

export const apiClient = axios.create({
  baseURL: appConfig.apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token) {
    config.headers.Authorization = token;
  }
  return config;
});

function responseStatus(error: unknown): number | undefined {
  return axios.isAxiosError(error) ? error.response?.status : undefined
}

function responseMessage(error: unknown): string | undefined {
  if (!axios.isAxiosError(error)) return undefined
  const message = error.response?.data?.message
  return typeof message === 'string' && message.trim() !== '' ? message : undefined
}

/**
 * The backend rejects usage queries with HTTP 503 while collection is off;
 * surface that case as a configuration prompt instead of a raw error.
 */
export function isUsageDisabledError(error: unknown): boolean {
  return responseStatus(error) === 503 && /disabled/i.test(String(responseMessage(error) ?? (error instanceof Error ? error.message : '')))
}

function isSessionExpired(error: unknown): boolean {
  const status = responseStatus(error)
  if (status === 401) return true
  // The auth middleware rejects expired sessions with 403 plus a fixed
  // message; permission denials keep their own distinct messages.
  return status === 403 && responseMessage(error) === SESSION_EXPIRED_MESSAGE
}

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Surface the backend-provided message so error banners are actionable
    // (e.g. "Usage collection is disabled") instead of axios defaults.
    const backendMessage = responseMessage(error)
    if (backendMessage) error.message = backendMessage
    if (isSessionExpired(error)) {
      tokenStorage.clear()
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  },
);
