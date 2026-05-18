import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
});

api.interceptors.request.use((config) => {
  console.log(
    `[API Request] ${config.method?.toUpperCase()} ${config.url}`,
    config.data
  );
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const method = error.config?.method?.toUpperCase() || 'REQUEST';
    const url = error.config?.url || 'unknown';
    const status = error.response?.status || 'NETWORK';
    const data = error.response?.data;

    if (error.response) {
      console.error(`[API Error] ${method} ${url} → ${status}`, data);
      if (!data || Object.keys(data).length === 0) {
        console.warn(
          'Backend returned an empty response – check the server logs for details.',
        );
      }
    } else {
      console.error(
        `[API Error] ${method} ${url} → ${status} (network failure)`,
      );
    }
    return Promise.reject(error);
  },
);

export default api;
