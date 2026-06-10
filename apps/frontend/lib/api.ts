import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
});

// Attach JWT on every request
api.interceptors.request.use((config) => {
  try {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token) {
      config.headers = config.headers ?? {};
      config.headers["Authorization"] = `Bearer ${token}`;
    }
  } catch {
    // localStorage unavailable — continue without token
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const method = error.config?.method?.toUpperCase() || "REQUEST";
    const url = error.config?.url || "unknown";
    const status = error.response?.status || "NETWORK";
    const data = error.response?.data;

    // 401 → clear token and redirect to login
    if (status === 401) {
      try { localStorage.removeItem("token"); } catch { /* noop */ }
      if (typeof window !== "undefined") window.location.replace("/login");
    }

    if (error.response) {
      console.error(`[API Error] ${method} ${url} → ${status}`, data);
      if (!data || Object.keys(data).length === 0) {
        console.warn("Backend returned an empty response – check the server logs for details.");
      }
    } else {
      console.error(`[API Error] ${method} ${url} → ${status} (network failure)`);
    }
    return Promise.reject(error);
  }
);

export default api;
