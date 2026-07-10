import { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { getRoutinesApi, getWorkoutHistoryApi } from "../../api/app.api";
import { useAuthStore } from "../../stores/useAuthStore";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const DAYS_ES = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];
const DAYS_SHORT = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sá"];
const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const LEVEL_COLOR: Record<string, string> = {
  beginner: "#22c55e",
  intermediate: "#f59e0b",
  advanced: "#ef4444",
};
const LEVEL_LABEL: Record<string, string> = {
  beginner: "Principiante",
  intermediate: "Intermedio",
  advanced: "Avanzado",
};
const DAY_SHORT: Record<string, string> = {
  Lunes: "Lu",
  Martes: "Ma",
  Miércoles: "Mi",
  Jueves: "Ju",
  Viernes: "Vi",
  Sábado: "Sá",
  Domingo: "Do",
};

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getWeekDates(referenceDate: Date) {
  const day = referenceDate.getDay(); // 0=Dom
  const monday = new Date(referenceDate);
  monday.setDate(referenceDate.getDate() - ((day + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function getMonthDates(year: number, month: number) {
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  // offset para empezar en lunes
  const startOffset = (firstDay.getDay() + 6) % 7;
  const days: (Date | null)[] = Array(startOffset).fill(null);
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month - 1, d));
  }
  while (days.length % 7 !== 0) days.push(null);
  return days;
}

// ─── Componente principal ─────────────────────────────────────────────────────
type ViewMode = "list" | "week" | "month";

export default function RoutinesScreen() {
  const user = useAuthStore((s) => s.user);
  const isMember = user?.role === "member";

  const [view, setView] = useState<ViewMode>("list");
  const [weekRef, setWeekRef] = useState(new Date());
  const [monthYear, setMonthYear] = useState(new Date().getFullYear());
  const [monthNum, setMonthNum] = useState(new Date().getMonth() + 1);

  const {
    data: routines = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["app-routines"],
    queryFn: getRoutinesApi,
    enabled: isMember,
  });

  // Historial del mes visible
  const fromDate =
    view === "week"
      ? toDateStr(getWeekDates(weekRef)[0])
      : `${monthYear}-${String(monthNum).padStart(2, "0")}-01`;
  const toDate =
    view === "week"
      ? toDateStr(getWeekDates(weekRef)[6])
      : `${monthYear}-${String(monthNum).padStart(2, "0")}-${new Date(monthYear, monthNum, 0).getDate()}`;

  const { data: workoutHistory = [] } = useQuery({
    queryKey: ["app-workouts", fromDate, toDate],
    queryFn: () => getWorkoutHistoryApi(fromDate, toDate),
    enabled: isMember && view !== "list",
  });

  // Map de routineId → fechas completadas
  const completedDates = useMemo(() => {
    const map: Record<string, Set<string>> = {};
    workoutHistory.forEach((log: any) => {
      const dateStr = toDateStr(new Date(log.doneAt));
      if (!map[log.routineId]) map[log.routineId] = new Set();
      map[log.routineId].add(dateStr);
    });
    return map;
  }, [workoutHistory]);

  // Rutinas que corresponden a un día de la semana
  const routinesForDay = (date: Date) => {
    const dayName = DAYS_ES[date.getDay()];
    return routines.filter((r: any) => r.days?.includes(dayName));
  };

  const isCompleted = (routineId: string, date: Date) =>
    completedDates[routineId]?.has(toDateStr(date)) ?? false;

  // ── Navegación semana/mes ────────────────────────────────────────────────────
  const prevWeek = () => {
    const d = new Date(weekRef);
    d.setDate(d.getDate() - 7);
    setWeekRef(d);
  };
  const nextWeek = () => {
    const d = new Date(weekRef);
    d.setDate(d.getDate() + 7);
    setWeekRef(d);
  };
  const prevMonth = () => {
    if (monthNum === 1) {
      setMonthNum(12);
      setMonthYear((y) => y - 1);
    } else setMonthNum((m) => m - 1);
  };
  const nextMonth = () => {
    if (monthNum === 12) {
      setMonthNum(1);
      setMonthYear((y) => y + 1);
    } else setMonthNum((m) => m + 1);
  };

  if (!isMember) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Rutinas</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>💪</Text>
          <Text style={styles.emptyTitle}>Función para miembros</Text>
          <Text style={styles.emptyText}>
            Asociate a un gym para ver tus rutinas.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Rutinas</Text>
        </View>
        <View style={styles.emptyContainer}>
          <ActivityIndicator color="#2563eb" size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Rutinas</Text>
        {/* Toggle de vista */}
        <View style={styles.viewToggle}>
          {(["list", "week", "month"] as ViewMode[]).map((v) => (
            <TouchableOpacity
              key={v}
              style={[styles.toggleBtn, view === v && styles.toggleBtnActive]}
              onPress={() => setView(v)}
            >
              <Text
                style={[
                  styles.toggleBtnText,
                  view === v && styles.toggleBtnTextActive,
                ]}
              >
                {v === "list" ? "Lista" : v === "week" ? "Semana" : "Mes"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── VISTA LISTA ── */}
      {view === "list" && (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor="#2563eb"
            />
          }
        >
          {routines.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyTitle}>Sin rutinas asignadas</Text>
              <Text style={styles.emptyText}>
                Tu gym todavía no te asignó ninguna rutina.
              </Text>
            </View>
          ) : (
            routines.map((routine: any) => (
              <TouchableOpacity
                key={routine.id}
                style={styles.card}
                onPress={() => router.push(`/routine/${routine.id}` as any)}
                activeOpacity={0.8}
              >
                <View style={styles.cardTitleRow}>
                  <Text style={styles.cardName}>{routine.name}</Text>
                  <View
                    style={[
                      styles.levelBadge,
                      { borderColor: LEVEL_COLOR[routine.level] },
                    ]}
                  >
                    <Text
                      style={[
                        styles.levelText,
                        { color: LEVEL_COLOR[routine.level] },
                      ]}
                    >
                      {LEVEL_LABEL[routine.level]}
                    </Text>
                  </View>
                </View>
                {routine.days?.length > 0 && (
                  <View style={styles.daysRow}>
                    {routine.days.map((day: string) => (
                      <View key={day} style={styles.dayChip}>
                        <Text style={styles.dayText}>
                          {DAY_SHORT[day] ?? day}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
                <View style={styles.cardFooter}>
                  <Text style={styles.exerciseCount}>
                    💪 {routine.exercises?.length ?? 0} ejercicios
                  </Text>
                  <Text style={styles.cardArrow}>→</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}

      {/* ── VISTA SEMANAL ── */}
      {view === "week" && (
        <ScrollView contentContainerStyle={styles.scroll}>
          {/* Navegador semana */}
          <View style={styles.navRow}>
            <TouchableOpacity onPress={prevWeek} style={styles.navBtn}>
              <Text style={styles.navBtnText}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.navLabel}>
              {(() => {
                const days = getWeekDates(weekRef);
                return `${days[0].getDate()} — ${days[6].getDate()} ${MONTHS[days[6].getMonth()]} ${days[6].getFullYear()}`;
              })()}
            </Text>
            <TouchableOpacity onPress={nextWeek} style={styles.navBtn}>
              <Text style={styles.navBtnText}>›</Text>
            </TouchableOpacity>
          </View>

          {getWeekDates(weekRef).map((date, i) => {
            const dayRoutines = routinesForDay(date);
            const isToday = toDateStr(date) === toDateStr(new Date());
            return (
              <View
                key={i}
                style={[styles.weekDayRow, isToday && styles.weekDayRowToday]}
              >
                {/* Columna día */}
                <View style={styles.weekDayCol}>
                  <Text
                    style={[
                      styles.weekDayName,
                      isToday && styles.weekDayNameToday,
                    ]}
                  >
                    {DAYS_SHORT[i === 6 ? 0 : i + 1]}
                  </Text>
                  <Text
                    style={[
                      styles.weekDayNum,
                      isToday && styles.weekDayNumToday,
                    ]}
                  >
                    {date.getDate()}
                  </Text>
                </View>

                {/* Rutinas del día */}
                <View style={styles.weekDayRoutines}>
                  {dayRoutines.length === 0 ? (
                    <Text style={styles.restDay}>Descanso</Text>
                  ) : (
                    dayRoutines.map((r: any) => {
                      const done = isCompleted(r.id, date);
                      return (
                        <TouchableOpacity
                          key={r.id}
                          style={[
                            styles.weekRoutineChip,
                            done && styles.weekRoutineChipDone,
                          ]}
                          onPress={() => router.push(`/routine/${r.id}` as any)}
                        >
                          <Text style={styles.weekRoutineIcon}>
                            {done ? "✅" : "💪"}
                          </Text>
                          <Text
                            style={[
                              styles.weekRoutineName,
                              done && styles.weekRoutineNameDone,
                            ]}
                          >
                            {r.name}
                          </Text>
                          <Text style={styles.weekRoutineCount}>
                            {r.exercises?.length ?? 0} ej.
                          </Text>
                        </TouchableOpacity>
                      );
                    })
                  )}
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* ── VISTA MENSUAL ── */}
      {view === "month" && (
        <ScrollView contentContainerStyle={styles.scroll}>
          {/* Navegador mes */}
          <View style={styles.navRow}>
            <TouchableOpacity onPress={prevMonth} style={styles.navBtn}>
              <Text style={styles.navBtnText}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.navLabel}>
              {MONTHS[monthNum - 1]} {monthYear}
            </Text>
            <TouchableOpacity onPress={nextMonth} style={styles.navBtn}>
              <Text style={styles.navBtnText}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Headers días */}
          <View style={styles.monthHeader}>
            {["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"].map((d) => (
              <Text key={d} style={styles.monthHeaderDay}>
                {d}
              </Text>
            ))}
          </View>

          {/* Grilla días */}
          <View style={styles.monthGrid}>
            {getMonthDates(monthYear, monthNum).map((date, i) => {
              if (!date)
                return <View key={`empty-${i}`} style={styles.monthCell} />;

              const dayRoutines = routinesForDay(date);
              const completedAll =
                dayRoutines.length > 0 &&
                dayRoutines.every((r: any) => isCompleted(r.id, date));
              const completedSome = dayRoutines.some((r: any) =>
                isCompleted(r.id, date),
              );
              const isToday = toDateStr(date) === toDateStr(new Date());

              return (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.monthCell,
                    isToday && styles.monthCellToday,
                    completedAll && styles.monthCellDone,
                    completedSome && !completedAll && styles.monthCellPartial,
                  ]}
                  onPress={() => dayRoutines.length > 0 && setView("week")}
                  disabled={dayRoutines.length === 0}
                >
                  <Text
                    style={[
                      styles.monthCellNum,
                      isToday && styles.monthCellNumToday,
                      completedAll && styles.monthCellNumDone,
                    ]}
                  >
                    {date.getDate()}
                  </Text>
                  {dayRoutines.length > 0 && (
                    <View style={styles.monthDots}>
                      {dayRoutines.slice(0, 3).map((r: any, j: number) => (
                        <View
                          key={j}
                          style={[
                            styles.monthDot,
                            isCompleted(r.id, date)
                              ? styles.monthDotDone
                              : styles.monthDotPending,
                          ]}
                        />
                      ))}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Leyenda */}
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.monthDot, styles.monthDotDone]} />
              <Text style={styles.legendText}>Completada</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.monthDot, styles.monthDotPending]} />
              <Text style={styles.legendText}>Pendiente</Text>
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8, gap: 12 },
  title: { fontSize: 28, fontWeight: "800", color: "#f1f5f9" },
  scroll: { padding: 16, gap: 12, paddingBottom: 32 },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    padding: 32,
  },
  emptyIcon: { fontSize: 48 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#f1f5f9",
    textAlign: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 20,
  },

  // Toggle
  viewToggle: {
    flexDirection: "row",
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  toggleBtnActive: { backgroundColor: "#2563eb" },
  toggleBtnText: { fontSize: 13, color: "#64748b", fontWeight: "600" },
  toggleBtnTextActive: { color: "#fff" },

  // Lista
  card: {
    backgroundColor: "#1e293b",
    borderRadius: 16,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: "#334155",
  },
  cardTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  cardName: { fontSize: 17, fontWeight: "700", color: "#f1f5f9", flex: 1 },
  levelBadge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  levelText: { fontSize: 11, fontWeight: "600" },
  daysRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  dayChip: {
    backgroundColor: "#0f172a",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#334155",
  },
  dayText: { fontSize: 12, color: "#94a3b8", fontWeight: "500" },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  exerciseCount: { fontSize: 13, color: "#64748b" },
  cardArrow: { fontSize: 16, color: "#2563eb", fontWeight: "700" },

  // Semana
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  navBtn: { padding: 8 },
  navBtnText: { fontSize: 28, color: "#2563eb", fontWeight: "300" },
  navLabel: { fontSize: 15, fontWeight: "700", color: "#f1f5f9" },

  weekDayRow: {
    flexDirection: "row",
    gap: 12,
    padding: 12,
    backgroundColor: "#1e293b",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#334155",
  },
  weekDayRowToday: { borderColor: "#2563eb" },
  weekDayCol: { width: 36, alignItems: "center", gap: 2 },
  weekDayName: { fontSize: 11, color: "#64748b", fontWeight: "600" },
  weekDayNameToday: { color: "#2563eb" },
  weekDayNum: { fontSize: 18, fontWeight: "800", color: "#94a3b8" },
  weekDayNumToday: { color: "#2563eb" },
  weekDayRoutines: { flex: 1, gap: 6 },
  restDay: { fontSize: 13, color: "#334155", alignSelf: "center" },
  weekRoutineChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#0f172a",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#334155",
  },
  weekRoutineChipDone: { borderColor: "#22c55e", backgroundColor: "#052e16" },
  weekRoutineIcon: { fontSize: 14 },
  weekRoutineName: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#f1f5f9",
  },
  weekRoutineNameDone: { color: "#22c55e" },
  weekRoutineCount: { fontSize: 11, color: "#64748b" },

  // Mes
  monthHeader: {
    flexDirection: "row",
    marginBottom: 4,
  },
  monthHeaderDay: {
    flex: 1,
    textAlign: "center",
    fontSize: 11,
    color: "#64748b",
    fontWeight: "700",
  },
  monthGrid: { flexDirection: "row", flexWrap: "wrap" },
  monthCell: {
    width: `${100 / 7}%` as any,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    borderRadius: 8,
    padding: 2,
  },
  monthCellToday: { backgroundColor: "#1e3a5f" },
  monthCellDone: { backgroundColor: "#052e16" },
  monthCellPartial: { backgroundColor: "#1c1a08" },
  monthCellNum: { fontSize: 14, color: "#94a3b8", fontWeight: "600" },
  monthCellNumToday: { color: "#60a5fa" },
  monthCellNumDone: { color: "#22c55e" },
  monthDots: { flexDirection: "row", gap: 2 },
  monthDot: { width: 5, height: 5, borderRadius: 3 },
  monthDotPending: { backgroundColor: "#2563eb" },
  monthDotDone: { backgroundColor: "#22c55e" },

  // Leyenda
  legend: {
    flexDirection: "row",
    gap: 16,
    justifyContent: "center",
    marginTop: 12,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendText: { fontSize: 12, color: "#64748b" },
});
