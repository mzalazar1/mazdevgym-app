import axios from "axios";
import { useAuthStore } from "../stores/useAuthStore";

const api = axios.create({
  baseURL: "https://gym26backend.onrender.com/api",
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// Interceptor — agrega el token en cada request
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Interceptor — maneja token expirado (401)
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = useAuthStore.getState().refreshToken;
        if (!refreshToken) throw new Error("No refresh token");
        const { data } = await axios.post(
          "https://gym26backend.onrender.com/api/app-auth/refresh",
          { refreshToken }
        );
        useAuthStore.getState().setAuth({
          user:         useAuthStore.getState().user!,
          accessToken:  data.accessToken,
          refreshToken: data.refreshToken,
        });
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        useAuthStore.getState().logout();
      }
    }
    return Promise.reject(error);
  }
);

export default api;
