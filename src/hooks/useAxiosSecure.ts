// src/hooks/useAxiosSecure.ts (নতুন ফাইল বা আপনার existing axios instance)

import axios from "axios";

const axiosSecure = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "",
  withCredentials: true, // ✅ cookie-based auth হলে
});

// ✅ Token interceptor
axiosSecure.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token"); // আপনার token storage অনুযায়ী
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

export default axiosSecure;
