import axios, { AxiosError } from "axios";

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
  (error: AxiosError) => {
    // Root cause 1 fix: the original code logged error.response?.data || error.message.
    // When the backend is unreachable (ECONNREFUSED, CORS block, static export)
    // error.response is undefined AND error.message is "" — so {} was logged.
    // This version surfaces the actual network/status detail so you can diagnose quickly.
    const status = error.response?.status;
    const data = error.response?.data;
    const url = error.config?.url;
    const method = error.config?.method?.toUpperCase();

    if (error.response) {
      // Backend responded with a non-2xx status
      console.error(
        `[API Error] ${method} ${url} → ${status}`,
        data
      );
    } else if (error.request) {
      // Request was sent but no response received (ECONNREFUSED, CORS, timeout)
      console.error(
        `[API Error] ${method} ${url} → No response received. ` +
        `Is the backend running at ${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}? ` +
        `Network error: ${error.message}`
      );
    } else {
      // Request setup error
      console.error(`[API Error] Request setup failed: ${error.message}`);
    }

    return Promise.reject(error);
  }
);

export default api;
