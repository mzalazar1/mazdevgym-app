import { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import DateTimePicker from "@react-native-community/datetimepicker";
import { getRoutinesApi, getWorkoutHistoryApi } from "../api/app.api";
import { useAuthStore } from "../stores/useAuthStore";
import { DAYS_ES, DAYS_SHORT, toDateStr, getWeekDates } from "../utils/weekHelpers";

const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

type DayStatus = "done" | "partial" | "missed" | "rest";

const STATUS_CONFIG: Record<DayStatus, { icon: string; chipStyle: string; label: string }> = {
  done:    { icon: "✅", chipStyle: "chipDone",    label: "Completó" },
  partial: { icon: "⚠️", chipStyle: "chipPartial", label: "Incompleto" },
  missed:  { icon: "❌", chipStyle: "chipMissed",  label: "No entrenó" },
  rest:    { icon: "",   chipStyle: "chipRest",    label: "Descanso" },
};

export default function WorkoutHistoryScreen() {
  const user = useAuthStore((s) => s.user);
  const isMember = user?.role === "member";

  const [weekRef, setWeekRef] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  const weekDates = getWeekDates(weekRef);
  const fromDate = toDateStr(weekDates[0]);
  const toDate = toDateStr(weekDates[6]);

  const { data: routines = [] } = useQuery({
    queryKey: ["app-routines"],
    queryFn: getRoutinesApi,
    enabled: isMember,
  });

  const { data: workoutHistory = [], isLoading, isError } = useQuery({
    queryKey: ["app-workouts", fromDate, toDate],
    queryFn: () => getWorkoutHistoryApi(fromDate, toDate),
  });

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
        <TouchableOpacity onPress={prevWeek} style={styles.navBtn}>
          <Text style={styles.navBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.navLabel}>
          {weekDates[0].getDate()} — {weekDates[6].getDate()} {MONTHS[weekDates[6].getMonth()]} {weekDates[6].getFullYear()}
        </Text>
        <View style={styles.navRightBtns}>
          <TouchableOpacity onPress={() => setShowPicker(true)} style={styles.navBtn}>
            <Text style={styles.navBtnText}>📅</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={nextWeek} style={styles.navBtn}>
            <Text style={styles.navBtnText}>›</Text>
          </TouchableOpacity>
        </View>
      </View>

      {showPicker && (
        <DateTimePicker
          value={weekRef}
          mode="date"
          display={Platform.OS === "ios" ? "inline" : "default"}
          onChange={(_event, selectedDate) => {
            setShowPicker(false);
            if (selectedDate) setWeekRef(selectedDate);
          }}
        />
      )}

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
            const dayName = DAYS_ES[date.getDay()];
            const dateStr = toDateStr(date);
            const isToday = dateStr === toDateStr(new Date());

            const expectedRoutine = routines.find((r: any) => r.days?.includes(dayName));
            const log = workoutHistory.find(
              (l: any) => toDateStr(new Date(l.doneAt)) === dateStr
            );

            let status: DayStatus;
            if (log) {
              const hasSkipped = log.exerciseLogs?.some((e: any) => e.skipped);
              status = hasSkipped ? "partial" : "done";
            } else if (expectedRoutine) {
              status = "missed";
            } else {
              status = "rest";
            }

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
});
