import axios from 'axios';
import { getSupabaseAccessToken, signOutFromSupabase } from '@/lib/auth';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
});

api.interceptors.request.use(async (config) => {
  try {
    const token =
      typeof window !== 'undefined' ? await getSupabaseAccessToken() : null;
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // Session unavailable. Continue without auth header.
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const method = error.config?.method?.toUpperCase() || 'REQUEST';
    const url = error.config?.url || 'unknown';
    const status = error.response?.status || 'NETWORK';
    const data = error.response?.data;

    if (status === 401) {
      await signOutFromSupabase().catch(() => undefined);
      if (typeof window !== 'undefined') {
        window.location.replace('/login');
      }
    }

    if (error.response) {
      console.error(`[API Error] ${method} ${url} -> ${status}`, data);
      if (!data || Object.keys(data).length === 0) {
        console.warn('Backend returned an empty response. Check the server logs.');
      }
    } else {
      console.error(`[API Error] ${method} ${url} -> ${status} (network failure)`);
    }

    return Promise.reject(error);
  },
);

export default api;
