import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const TOKEN_KEY = "royal_auth_token";

// console.log(localStorage.getItem("royal_auth_token"));

// ── Typed API error helper ────────────────────────────────────────────────────
export interface ApiError {
  response?: {
    status?: number;
    data?: { message?: string };
  };
  message?: string;
}

export const getApiMessage = (err: unknown, fallback: string): string =>
  (err as ApiError)?.response?.data?.message ?? fallback;

export const multipartConfig = {
  headers: {
    "Content-Type": "multipart/form-data",
  },
};

const axiosPublic = axios.create({
  baseURL: API_URL,
  timeout: 1500000,
  withCredentials: false,
  headers: { "X-Requested-With": "XMLHttpRequest" },
});

axiosPublic.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) config.headers["Authorization"] = `Bearer ${token}`;
    if (!(config.data instanceof FormData)) {
      config.headers["Content-Type"] = "application/json";
    }
    return config;
  },
  (error: unknown) => Promise.reject(error),
);

axiosPublic.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const err = error as ApiError;
    const status = err?.response?.status;
    if (status === 500) {
      console.error("[API] Server error:", err?.response?.data?.message);
    } else if (!status) {
      console.warn("[API] Network error or timeout:", err?.message);
    }
    return Promise.reject(error);
  },
);

export { axiosPublic };
export default axiosPublic;
