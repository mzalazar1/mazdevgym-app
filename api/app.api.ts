import api from "./axios";

// ── Perfil ────────────────────────────────────────────────────────────────────
export const getProfileApi = async () => {
  const res = await api.get("/app/profile");
  return res.data;
};

// ── Avisos del gym ────────────────────────────────────────────────────────────
export interface Announcement {
  id: string;
  message: string;
  urgent: boolean;
  validUntil: string | null;
  targetMemberId: string | null;
  createdAt: string;
}

// Solo vigentes, urgentes primero. [] si el usuario no tiene gym.
export const getAnnouncementsApi = async (): Promise<Announcement[]> => {
  const res = await api.get("/app/announcements");
  return res.data;
};

// ── Info del gym (horarios, cierres, dirección) ───────────────────────────────
export interface DaySchedule {
  open: boolean;
  from?: string; // "HH:mm"
  to?: string;   // "HH:mm"
}

export type WeekdayKey =
  | "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

export type GymSchedule = Record<WeekdayKey, DaySchedule>;

export interface GymClosure {
  id: string;
  date: string; // ISO, medianoche UTC del día del cierre
  reason: string | null;
}

export interface GymInfo {
  id: string;
  name: string;
  logo: string | null;
  orgType: string;
  address: string | null;
  city: string | null;
  province: string | null;
  schedule: GymSchedule | null;
  closures: GymClosure[];
}

export const getGymApi = async (): Promise<GymInfo> => {
  const res = await api.get("/app/gym");
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

export const getComplianceApi = async () => {
  console.log(`[DEBUG-COMPLIANCE] queryFn ejecutándose @ ${new Date().toISOString()}`);
  const res = await api.get("/app/stats/compliance");
  console.log(`[DEBUG-COMPLIANCE] queryFn resuelto @ ${new Date().toISOString()}`, res.data);
  return res.data;
};
