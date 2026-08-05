import axios from 'axios';
import {
  getAccessToken,
  setAccessToken,
  getRefreshToken,
  clearAuth,
} from '../utils/storage';

const client = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Track refresh promise to avoid concurrent refresh calls
let refreshPromise: Promise<string | null> | null = null;

// Request interceptor: attach JWT
client.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle 401
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only attempt refresh on 401 and if we haven't already retried
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      originalRequest.url !== '/auth/login' &&
      originalRequest.url !== '/auth/refresh'
    ) {
      originalRequest._retry = true;

      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        clearAuth();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        // Deduplicate concurrent refresh calls
        if (!refreshPromise) {
          refreshPromise = client
            .post('/auth/refresh', { refresh_token: refreshToken })
            .then((res) => {
              const newToken = res.data.access_token;
              if (newToken) {
                setAccessToken(newToken);
              }
              return newToken;
            })
            .catch(() => {
              clearAuth();
              window.location.href = '/login';
              return null;
            })
            .finally(() => {
              refreshPromise = null;
            });
        }

        const newToken = await refreshPromise;
        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return client(originalRequest);
        }
      } catch {
        clearAuth();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  },
);

export default client;
