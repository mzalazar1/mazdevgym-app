import api from "./axios";

export const loginApi = async (data: { email: string; password: string; pushToken?: string }) => {
  const res = await api.post("/app-auth/login", data);
  return res.data;
};

export const registerApi = async (data: {
  name: string;
  email: string;
  password: string;
  phone?: string;
}) => {
  const res = await api.post("/app-auth/register", data);
  return res.data;
};

export const getMeApi = async () => {
  const res = await api.get("/app-auth/me");
  return res.data;
};

export const refreshApi = async (refreshToken: string) => {
  const res = await api.post("/app-auth/refresh", { refreshToken });
  return res.data;
};

export const logoutApi = async (refreshToken: string) => {
  await api.post("/app-auth/logout", { refreshToken });
};

export const forgotPasswordApi = async (email: string) => {
  await api.post("/app-auth/forgot-password", { email });
};
