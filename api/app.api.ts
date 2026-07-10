import api from "./axios";

// ── Perfil ────────────────────────────────────────────────────────────────────
export const getProfileApi = async () => {
  const res = await api.get("/app/profile");
  return res.data;
};

// ── Rutinas ───────────────────────────────────────────────────────────────────
export const getRoutinesApi = async () => {
  const res = await api.get("/app/routines");
  return res.data;
};

export const getRoutineDetailApi = async (id: string) => {
  const res = await api.get(`/app/routines/${id}`);
  return res.data;
};

// ── Turnos ────────────────────────────────────────────────────────────────────
export const getShiftsApi = async (from?: string, to?: string) => {
  const res = await api.get("/app/shifts", { params: { from, to } });
  return res.data;
};

export const bookShiftApi = async (shiftId: string) => {
  const res = await api.post(`/app/shifts/${shiftId}/book`);
  return res.data;
};

export const cancelShiftApi = async (shiftId: string) => {
  const res = await api.delete(`/app/shifts/${shiftId}/book`);
  return res.data;
};

// ── Tienda ────────────────────────────────────────────────────────────────────
export const getShopApi = async () => {
  const res = await api.get("/app/shop");
  return res.data;
};

// ── Entrenamientos ────────────────────────────────────────────────────────────
export const logWorkoutApi = async (data: any) => {
  const res = await api.post("/app/workouts", data);
  return res.data;
};

export const getWorkoutHistoryApi = async (from?: string, to?: string) => {
  const res = await api.get("/app/workouts", { params: { from, to } });
  return res.data;
};

// ── Progreso físico ───────────────────────────────────────────────────────────
export const getBodyProgressApi = async () => {
  const res = await api.get("/app/progress/body");
  return res.data;
};

export const logBodyProgressApi = async (data: any) => {
  const res = await api.post("/app/progress/body", data);
  return res.data;
};

// ── Estadísticas ──────────────────────────────────────────────────────────────
export const getMonthlyStatsApi = async (year: number, month: number) => {
  const res = await api.get("/app/stats/monthly", { params: { year, month } });
  return res.data;
};
