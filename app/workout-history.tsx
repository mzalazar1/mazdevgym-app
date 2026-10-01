import { useState, useMemo } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Modal, Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Calendar } from "react-native-calendars";
import { getProfileApi, getRoutinesApi, getWorkoutHistoryApi } from "../api/app.api";
import { useAuthStore } from "../stores/useAuthStore";
import { DAYS_ES, DAYS_SHORT, toDateStr, getWeekDates } from "../utils/weekHelpers";

const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

type DayStatus = "done" | "partial" | "missed" | "upcoming" | "rest";

const STATUS_CONFIG: Record<DayStatus, { icon: string; chipStyle: string; label: string }> = {
  done:     { icon: "✅", chipStyle: "chipDone",    label: "Completó" },
  partial:  { icon: "⚠️", chipStyle: "chipPartial", label: "Incompleto" },
  missed:   { icon: "❌", chipStyle: "chipMissed",  label: "No entrenó" },
  // Rutina planificada pero todavía no evaluable: mismo aspecto neutro que un día de descanso.
  upcoming: { icon: "",   chipStyle: "chipRest",    label: "Pendiente" },
  rest:     { icon: "",   chipStyle: "chipRest",    label: "Descanso" },
};

// Misma regla para la vista semanal y el calendario mensual:
// log con algún ejercicio salteado → parcial; log completo → hecho;
// sin log pero con rutina asignada ese día de la semana → faltó, solo si el día ya pasó
// y es posterior al registro del usuario (si no → pendiente); sin rutina → descanso.
function getDayStatus(date: Date, routines: any[], logs: any[], createdStr?: string) {
  const dateStr = toDateStr(date);
  const expectedRoutine = routines.find((r: any) => r.days?.includes(DAYS_ES[date.getDay()]));
  const log = logs.find((l: any) => toDateStr(new Date(l.doneAt)) === dateStr);

  let status: DayStatus;
  if (log) {
    status = log.exerciseLogs?.some((e: any) => e.skipped) ? "partial" : "done";
  } else if (expectedRoutine) {
    const evaluable = dateStr < toDateStr(new Date()) && (!createdStr || dateStr >= createdStr);
    status = evaluable ? "missed" : "upcoming";
  } else {
    status = "rest";
  }
  return { status, log, expectedRoutine };
}

const CAL_MARK_STYLES: Partial<Record<DayStatus, any>> = {
  done:    { container: { backgroundColor: "#22c55e" }, text: { color: "#0f172a", fontWeight: "700" } },
  partial: { container: { backgroundColor: "#f59e0b" }, text: { color: "#0f172a", fontWeight: "700" } },
  missed:  { container: { backgroundColor: "transparent", borderWidth: 2, borderColor: "#ef4444" }, text: { color: "#f1f5f9" } },
};

const CAL_THEME = {
  calendarBackground: "#1e293b",
  backgroundColor: "#1e293b",
  monthTextColor: "#f1f5f9",
  textMonthFontWeight: "700" as const,
  textSectionTitleColor: "#64748b",
  dayTextColor: "#f1f5f9",
  textDisabledColor: "#334155",
  todayTextColor: "#2563eb",
  arrowColor: "#2563eb",
};

export default function WorkoutHistoryScreen() {
  const user = useAuthStore((s) => s.user);
  const isMember = user?.role === "member";

  const [weekRef, setWeekRef] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  // Primer día del mes visible en el calendario ("YYYY-MM-01")
  const [calMonth, setCalMonth] = useState(() => toDateStr(new Date()).slice(0, 8) + "01");

  const weekDates = getWeekDates(weekRef);
  const fromDate = toDateStr(weekDates[0]);
  const toDate = toDateStr(weekDates[6]);

  const { data: profile } = useQuery({
    queryKey: ["app-profile"],
    queryFn: getProfileApi,
  });
  const createdAt: Date | null = profile?.createdAt ? new Date(profile.createdAt) : null;

  const { data: routines = [] } = useQuery({
    queryKey: ["app-routines"],
    queryFn: getRoutinesApi,
    enabled: isMember,
  });

  const { data: workoutHistory = [], isLoading, isError } = useQuery({
    queryKey: ["app-workouts", fromDate, toDate],
    queryFn: () => getWorkoutHistoryApi(fromDate, toDate),
  });

  const calYear = Number(calMonth.slice(0, 4));
  const calMonthIdx = Number(calMonth.slice(5, 7)) - 1;
  const calFrom = calMonth;
  const calTo = toDateStr(new Date(calYear, calMonthIdx + 1, 0));

  const { data: monthHistory = [] } = useQuery({
    queryKey: ["app-workouts", calFrom, calTo],
    queryFn: () => getWorkoutHistoryApi(calFrom, calTo),
    enabled: showCalendar,
  });

  const createdStr = createdAt ? toDateStr(createdAt) : undefined;

  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};
    const lastDay = Number(calTo.slice(8, 10));
    for (let day = 1; day <= lastDay; day++) {
      const date = new Date(calYear, calMonthIdx, day);
      const { status } = getDayStatus(date, routines, monthHistory, createdStr);
      const customStyles = CAL_MARK_STYLES[status];
      if (customStyles) marks[toDateStr(date)] = { customStyles };
    }
    return marks;
  }, [calYear, calMonthIdx, calTo, routines, monthHistory, createdStr]);

  const openCalendar = () => {
    setCalMonth(toDateStr(weekRef).slice(0, 8) + "01");
    setShowCalendar(true);
  };

  // La semana visible ya incluye (o es anterior a) la fecha de registro: no hay nada más atrás para ver.
  const isEarliestWeek = createdAt ? fromDate <= toDateStr(createdAt) : false;

  const prevWeek = () => {
    if (isEarliestWeek) return;
    const d = new Date(weekRef);
    d.setDate(d.getDate() - 7);
    setWeekRef(d);
  };
  const nextWeek = () => {
    const d = new Date(weekRef);
    d.setDate(d.getDate() + 7);
    setWeekRef(d);
  };

  const openLog = (log: any, routineName?: string) => {
    router.push({
      pathname: "/workout-log/[id]",
      params: { id: log.id, data: JSON.stringify({ ...log, routineName }) },
    } as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Historial de entrenamientos</Text>
      </View>

      {/* Navegador semana */}
      <View style={styles.navRow}>
        <TouchableOpacity
          onPress={prevWeek}
          style={styles.navBtn}
          disabled={isEarliestWeek}
        >
          <Text style={[styles.navBtnText, isEarliestWeek && styles.navBtnTextDisabled]}>
            ‹
          </Text>
        </TouchableOpacity>
        <Text style={styles.navLabel}>
          {weekDates[0].getDate()} — {weekDates[6].getDate()} {MONTHS[weekDates[6].getMonth()]} {weekDates[6].getFullYear()}
        </Text>
        <View style={styles.navRightBtns}>
          <TouchableOpacity onPress={openCalendar} style={styles.navBtn}>
            <Text style={styles.navBtnText}>📅</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={nextWeek} style={styles.navBtn}>
            <Text style={styles.navBtnText}>›</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={showCalendar}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCalendar(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setShowCalendar(false)}>
          {/* Pressable interno para que los toques dentro de la tarjeta no cierren el modal */}
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Calendar
              initialDate={toDateStr(weekRef)}
              minDate={createdStr}
              markingType="custom"
              markedDates={markedDates}
              hideExtraDays
              firstDay={1}
              enableSwipeMonths
              theme={CAL_THEME}
              onMonthChange={(m) => setCalMonth(m.dateString.slice(0, 8) + "01")}
              onDayPress={(d) => {
                setShowCalendar(false);
                setWeekRef(new Date(d.year, d.month - 1, d.day));
              }}
            />
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: "#22c55e" }]} />
                <Text style={styles.legendText}>Completó</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: "#f59e0b" }]} />
                <Text style={styles.legendText}>Incompleto</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, styles.legendDotMissed]} />
                <Text style={styles.legendText}>No entrenó</Text>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#2563eb" size="large" />
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>
            No se pudo cargar el historial, intentá más tarde.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {weekDates.map((date, i) => {
            const isToday = toDateStr(date) === toDateStr(new Date());
            const { status, log, expectedRoutine } = getDayStatus(date, routines, workoutHistory, createdStr);

            const routineName =
              expectedRoutine?.name ??
              routines.find((r: any) => r.id === log?.routineId)?.name;

            const cfg = STATUS_CONFIG[status];

            return (
              <TouchableOpacity
                key={i}
                style={[
                  styles.dayRow,
                  isToday && styles.dayRowToday,
                  styles[cfg.chipStyle as keyof typeof styles] as any,
                ]}
                onPress={() => log && openLog(log, routineName)}
                disabled={!log}
                activeOpacity={log ? 0.8 : 1}
              >
                <View style={styles.dayCol}>
                  <Text style={[styles.dayShort, isToday && styles.dayShortToday]}>
                    {DAYS_SHORT[i === 6 ? 0 : i + 1]}
                  </Text>
                  <Text style={[styles.dayNum, isToday && styles.dayNumToday]}>
                    {date.getDate()}
                  </Text>
                </View>

                <View style={styles.dayContent}>
                  <Text style={styles.dayRoutineName}>
                    {routineName ?? "Sin actividad planificada"}
                  </Text>
                  <Text style={styles.dayStatusLabel}>{cfg.label}</Text>
                </View>

                <Text style={styles.dayIcon}>{cfg.icon}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },
  errorText: { fontSize: 14, color: "#64748b", textAlign: "center", lineHeight: 20 },
  header: { padding: 20, gap: 4, borderBottomWidth: 1, borderBottomColor: "#1e293b" },
  backBtn: { marginBottom: 8 },
  backText: { color: "#2563eb", fontSize: 14, fontWeight: "600" },
  title: { fontSize: 22, fontWeight: "800", color: "#f1f5f9" },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  navRightBtns: { flexDirection: "row", alignItems: "center" },
  navBtn: { padding: 8 },
  navBtnText: { fontSize: 22, color: "#2563eb", fontWeight: "600" },
  navBtnTextDisabled: { color: "#334155" },
  navLabel: { fontSize: 15, fontWeight: "700", color: "#f1f5f9" },
  scroll: { padding: 16, gap: 10, paddingBottom: 32 },
  dayRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    backgroundColor: "#1e293b",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#334155",
  },
  dayRowToday: { borderColor: "#2563eb" },
  chipDone: { borderColor: "#22c55e", backgroundColor: "#052e16" },
  chipPartial: { borderColor: "#f59e0b", backgroundColor: "#1c1a08" },
  chipMissed: { borderColor: "#334155" },
  chipRest: { borderColor: "#334155", opacity: 0.6 },
  dayCol: { width: 36, alignItems: "center", gap: 2 },
  dayShort: { fontSize: 11, color: "#64748b", fontWeight: "600" },
  dayShortToday: { color: "#2563eb" },
  dayNum: { fontSize: 18, fontWeight: "800", color: "#94a3b8" },
  dayNumToday: { color: "#2563eb" },
  dayContent: { flex: 1, gap: 2 },
  dayRoutineName: { fontSize: 14, fontWeight: "600", color: "#f1f5f9" },
  dayStatusLabel: { fontSize: 11, color: "#64748b" },
  dayIcon: { fontSize: 20 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.85)",
    justifyContent: "center",
    padding: 16,
  },
  modalCard: {
    backgroundColor: "#1e293b",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#334155",
    padding: 8,
    overflow: "hidden",
  },
  legendRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#334155",
    marginTop: 4,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  legendDotMissed: { borderWidth: 2, borderColor: "#ef4444" },
  legendText: { fontSize: 12, color: "#94a3b8" },
});
