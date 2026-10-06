import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Image, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Linking from "expo-linking";
import { useQuery } from "@tanstack/react-query";
import { getGymApi, type DaySchedule, type WeekdayKey } from "../api/app.api";
import { DAYS_ES } from "../utils/weekHelpers";

const MONTHS_LOWER = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

// Orden de las filas: lunes a domingo
const WEEK_ROWS: { key: WeekdayKey; label: string }[] = [
  { key: "monday",    label: "Lunes" },
  { key: "tuesday",   label: "Martes" },
  { key: "wednesday", label: "Miércoles" },
  { key: "thursday",  label: "Jueves" },
  { key: "friday",    label: "Viernes" },
  { key: "saturday",  label: "Sábado" },
  { key: "sunday",    label: "Domingo" },
];

// Indexado por Date.getDay(), que arranca en domingo (0 = domingo, 6 = sábado)
const KEY_BY_GETDAY: WeekdayKey[] = [
  "sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday",
];

// Las fechas de cierre son medianoche UTC del día elegido: se arma el texto desde
// "YYYY-MM-DD" para no correrse al día anterior con la zona horaria del celular.
function formatClosureDate(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  const weekday = DAYS_ES[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return `${weekday} ${d} de ${MONTHS_LOWER[m - 1]}`;
}

// Día con open:false, sin datos o sin horario completo → "Cerrado"
function scheduleText(day?: DaySchedule) {
  if (!day?.open || !day.from || !day.to) return "Cerrado";
  return `${day.from} – ${day.to}`;
}

export default function GymInfoScreen() {
  const { data: gym, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ["app-gym"],
    queryFn: getGymApi,
  });

  const todayKey = KEY_BY_GETDAY[new Date().getDay()];

  const mapsQuery = gym
    ? [gym.address, gym.city, gym.province].filter((p) => p && p.trim()).join(", ")
    : "";

  const openMaps = async () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert("No se pudo abrir el mapa", "Intentá de nuevo más tarde.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Horarios y cómo llegar</Text>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#2563eb" size="large" />
        </View>
      ) : isError || !gym ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>No se pudo cargar la información</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#2563eb" />
          }
        >
          {/* Gym */}
          <View style={styles.gymRow}>
            {gym.logo ? <Image source={{ uri: gym.logo }} style={styles.logo} /> : null}
            <Text style={styles.gymName}>{gym.name}</Text>
          </View>

          {/* Horarios */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Horarios</Text>
            {gym.schedule ? (
              <View style={styles.card}>
                {WEEK_ROWS.map(({ key, label }, i) => {
                  const isToday = key === todayKey;
                  return (
                    <View
                      key={key}
                      style={[
                        styles.scheduleRow,
                        i > 0 && styles.scheduleRowBorder,
                        isToday && styles.scheduleRowToday,
                      ]}
                    >
                      <Text style={[styles.dayLabel, isToday && styles.todayText]}>
                        {label}{isToday ? " (hoy)" : ""}
                      </Text>
                      <Text style={[styles.dayHours, isToday && styles.todayText]}>
                        {scheduleText(gym.schedule?.[key])}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={styles.card}>
                <Text style={styles.emptyText}>El gimnasio todavía no cargó sus horarios</Text>
              </View>
            )}
          </View>

          {/* Próximos cierres */}
          {gym.closures.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Próximos cierres</Text>
              <View style={styles.card}>
                {gym.closures.map((c, i) => (
                  <View key={c.id} style={[styles.closureRow, i > 0 && styles.scheduleRowBorder]}>
                    <Text style={styles.closureDate}>{formatClosureDate(c.date)}</Text>
                    {c.reason ? <Text style={styles.closureReason}>{c.reason}</Text> : null}
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Cómo llegar */}
          {gym.address?.trim() ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Cómo llegar</Text>
              <Text style={styles.addressText}>{mapsQuery}</Text>
              <TouchableOpacity style={styles.mapsBtn} onPress={openMaps}>
                <Text style={styles.mapsBtnText}>📍 Cómo llegar</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32, gap: 16 },
  errorText: { fontSize: 14, color: "#64748b", textAlign: "center", lineHeight: 20 },
  retryBtn: {
    backgroundColor: "#2563eb",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  retryText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  header: { padding: 20, gap: 4, borderBottomWidth: 1, borderBottomColor: "#1e293b" },
  backBtn: { marginBottom: 8 },
  backText: { color: "#2563eb", fontSize: 14, fontWeight: "600" },
  title: { fontSize: 22, fontWeight: "800", color: "#f1f5f9" },
  scroll: { padding: 16, gap: 20, paddingBottom: 32 },
  gymRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  logo: { width: 48, height: 48, borderRadius: 12, backgroundColor: "#1e293b" },
  gymName: { flex: 1, fontSize: 18, fontWeight: "800", color: "#f1f5f9" },
  section: { gap: 10 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#f1f5f9" },
  card: {
    backgroundColor: "#1e293b",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#334155",
    overflow: "hidden",
  },
  scheduleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  scheduleRowBorder: { borderTopWidth: 1, borderTopColor: "#334155" },
  scheduleRowToday: { backgroundColor: "#172554" },
  dayLabel: { fontSize: 14, fontWeight: "600", color: "#cbd5e1" },
  dayHours: { fontSize: 14, color: "#94a3b8" },
  todayText: { color: "#60a5fa", fontWeight: "700" },
  emptyText: { fontSize: 14, color: "#64748b", padding: 14, lineHeight: 20 },
  closureRow: { paddingVertical: 12, paddingHorizontal: 14, gap: 2 },
  closureDate: { fontSize: 14, fontWeight: "600", color: "#f1f5f9" },
  closureReason: { fontSize: 13, color: "#94a3b8", lineHeight: 18 },
  addressText: { fontSize: 14, color: "#94a3b8", lineHeight: 20 },
  mapsBtn: {
    backgroundColor: "#2563eb",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  mapsBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
