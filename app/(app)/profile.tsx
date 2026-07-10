import { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { getProfileApi, getMonthlyStatsApi, getBodyProgressApi } from "../../api/app.api";
import { useAuthStore } from "../../stores/useAuthStore";
import { router } from "expo-router";

const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

const MEDAL_CONFIG = {
  gold:   { emoji: "🥇", label: "Medalla de Oro",   color: "#f59e0b", bg: "#f59e0b20" },
  silver: { emoji: "🥈", label: "Medalla de Plata",  color: "#94a3b8", bg: "#94a3b820" },
  bronze: { emoji: "🥉", label: "Medalla de Bronce", color: "#b45309", bg: "#b4530920" },
};

function getMembershipStatusLabel(expiresAt: string | null) {
  if (!expiresAt) return { label: "Sin membresía", color: "#64748b" };
  const diff = new Date(expiresAt).getTime() - Date.now();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days < 0)  return { label: "Vencida",        color: "#ef4444" };
  if (days <= 3) return { label: `Vence en ${days} día${days !== 1 ? "s" : ""}`, color: "#f59e0b" };
  return { label: `Vigente · vence ${new Date(expiresAt).toLocaleDateString("es-AR")}`, color: "#22c55e" };
}

export default function ProfileScreen() {
  const user   = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const now   = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const { data: profile, isLoading: loadingProfile, refetch, isRefetching } = useQuery({
    queryKey: ["app-profile"],
    queryFn:  getProfileApi,
  });

  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ["app-stats", year, month],
    queryFn:  () => getMonthlyStatsApi(year, month),
  });

  const { data: bodyProgress = [] } = useQuery({
    queryKey: ["app-body-progress"],
    queryFn:  getBodyProgressApi,
  });

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const handleLogout = () => {
    Alert.alert("Cerrar sesión", "¿Estás seguro?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Cerrar sesión", style: "destructive", onPress: () => {
        logout();
        router.replace("/(auth)/login");
      }},
    ]);
  };

  const memberStatus = getMembershipStatusLabel(profile?.member?.expiresAt ?? null);
  const lastWeight   = bodyProgress.length > 0
    ? bodyProgress[bodyProgress.length - 1]
    : null;

  if (loadingProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <ActivityIndicator color="#2563eb" size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#2563eb" />}
      >
        {/* Avatar + nombre */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(profile?.name ?? user?.name ?? "?")[0].toUpperCase()}
            </Text>
          </View>
          <Text style={styles.name}>{profile?.name ?? user?.name}</Text>
          <Text style={styles.email}>{profile?.email ?? user?.email}</Text>
          {profile?.gym && (
            <View style={styles.gymBadge}>
              <Text style={styles.gymBadgeText}>🏋️ {profile.gym.name}</Text>
            </View>
          )}
        </View>

        {/* Membresía */}
        {user?.role === "member" && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Membresía</Text>
            <View style={styles.membershipRow}>
              <View>
                <Text style={styles.membershipType}>
                  {profile?.member?.membershipType ?? "—"}
                </Text>
                <Text style={[styles.membershipStatus, { color: memberStatus.color }]}>
                  {memberStatus.label}
                </Text>
              </View>
              <View style={[styles.statusDot, { backgroundColor: memberStatus.color }]} />
            </View>
          </View>
        )}

        {/* Estadísticas del mes */}
        <View style={styles.card}>
          <View style={styles.statsHeader}>
            <Text style={styles.cardTitle}>Performance</Text>
            <View style={styles.monthNav}>
              <TouchableOpacity onPress={prevMonth} style={styles.monthBtn}>
                <Text style={styles.monthBtnText}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.monthLabel}>{MONTHS[month - 1].slice(0,3)} {year}</Text>
              <TouchableOpacity onPress={nextMonth} style={styles.monthBtn}>
                <Text style={styles.monthBtnText}>›</Text>
              </TouchableOpacity>
            </View>
          </View>

          {loadingStats ? (
            <ActivityIndicator color="#2563eb" style={{ marginVertical: 16 }} />
          ) : stats ? (
            <View style={styles.statsContent}>
              {/* Barra de progreso */}
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBar, { width: `${stats.pct}%` as any }]} />
              </View>
              <Text style={styles.progressPct}>{stats.pct}% completado</Text>
              <Text style={styles.progressDetail}>
                {stats.completed} de {stats.total} entrenamientos
              </Text>

              {/* Medalla */}
              {stats.medal && MEDAL_CONFIG[stats.medal as keyof typeof MEDAL_CONFIG] && (
                <View style={[styles.medalBadge, { backgroundColor: MEDAL_CONFIG[stats.medal as keyof typeof MEDAL_CONFIG].bg }]}>
                  <Text style={styles.medalEmoji}>{MEDAL_CONFIG[stats.medal as keyof typeof MEDAL_CONFIG].emoji}</Text>
                  <Text style={[styles.medalLabel, { color: MEDAL_CONFIG[stats.medal as keyof typeof MEDAL_CONFIG].color }]}>
                    {MEDAL_CONFIG[stats.medal as keyof typeof MEDAL_CONFIG].label}
                  </Text>
                </View>
              )}

              {/* Mensaje motivador */}
              <Text style={styles.statsMessage}>{stats.message}</Text>

              {/* Stats extra */}
              {(stats.avgDuration || stats.avgRpe) && (
                <View style={styles.extraStats}>
                  {stats.avgDuration && (
                    <View style={styles.extraStat}>
                      <Text style={styles.extraStatValue}>{stats.avgDuration} min</Text>
                      <Text style={styles.extraStatLabel}>Duración promedio</Text>
                    </View>
                  )}
                  {stats.avgRpe && (
                    <View style={styles.extraStat}>
                      <Text style={styles.extraStatValue}>{stats.avgRpe}/10</Text>
                      <Text style={styles.extraStatLabel}>Esfuerzo promedio</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          ) : null}
        </View>

        {/* Progreso físico */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>Progreso físico</Text>
            <TouchableOpacity onPress={() => router.push("/log-progress" as any)}>
              <Text style={styles.addLink}>+ Registrar</Text>
            </TouchableOpacity>
          </View>

          {lastWeight ? (
            <View style={styles.weightRow}>
              <View style={styles.weightItem}>
                <Text style={styles.weightValue}>{Number(lastWeight.weightKg).toFixed(1)} kg</Text>
                <Text style={styles.weightLabel}>Peso actual</Text>
              </View>
              {lastWeight.waistCm && (
                <View style={styles.weightItem}>
                  <Text style={styles.weightValue}>{Number(lastWeight.waistCm).toFixed(1)} cm</Text>
                  <Text style={styles.weightLabel}>Cintura</Text>
                </View>
              )}
              {lastWeight.bodyFatPct && (
                <View style={styles.weightItem}>
                  <Text style={styles.weightValue}>{Number(lastWeight.bodyFatPct).toFixed(1)}%</Text>
                  <Text style={styles.weightLabel}>Grasa corporal</Text>
                </View>
              )}
            </View>
          ) : (
            <Text style={styles.noDataText}>
              Todavía no registraste medidas. Tocá "+ Registrar" para empezar.
            </Text>
          )}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: "#0f172a" },
  scroll:           { padding: 20, gap: 16, paddingBottom: 32 },
  emptyContainer:   { flex: 1, justifyContent: "center", alignItems: "center" },
  avatarSection:    { alignItems: "center", gap: 8, paddingVertical: 8 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: "#2563eb",
    justifyContent: "center", alignItems: "center",
  },
  avatarText:       { fontSize: 32, fontWeight: "800", color: "#fff" },
  name:             { fontSize: 22, fontWeight: "800", color: "#f1f5f9" },
  email:            { fontSize: 13, color: "#64748b" },
  gymBadge:         { backgroundColor: "#1e3a5f", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, marginTop: 4 },
  gymBadgeText:     { fontSize: 13, color: "#60a5fa", fontWeight: "600" },
  card: {
    backgroundColor: "#1e293b",
    borderRadius:    16,
    padding:         16,
    gap:             12,
    borderWidth:     1,
    borderColor:     "#334155",
  },
  cardTitle:        { fontSize: 16, fontWeight: "700", color: "#f1f5f9" },
  cardTitleRow:     { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  addLink:          { fontSize: 13, color: "#2563eb", fontWeight: "600" },
  membershipRow:    { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  membershipType:   { fontSize: 15, fontWeight: "600", color: "#f1f5f9" },
  membershipStatus: { fontSize: 13, marginTop: 2 },
  statusDot:        { width: 10, height: 10, borderRadius: 5 },
  statsHeader:      { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  monthNav:         { flexDirection: "row", alignItems: "center", gap: 4 },
  monthBtn:         { padding: 4 },
  monthBtnText:     { fontSize: 20, color: "#2563eb" },
  monthLabel:       { fontSize: 13, fontWeight: "600", color: "#94a3b8", minWidth: 60, textAlign: "center" },
  statsContent:     { gap: 10 },
  progressBarContainer: {
    height: 8, backgroundColor: "#334155", borderRadius: 4, overflow: "hidden",
  },
  progressBar:      { height: "100%", backgroundColor: "#2563eb", borderRadius: 4 },
  progressPct:      { fontSize: 24, fontWeight: "800", color: "#f1f5f9" },
  progressDetail:   { fontSize: 13, color: "#64748b" },
  medalBadge:       { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 12 },
  medalEmoji:       { fontSize: 28 },
  medalLabel:       { fontSize: 15, fontWeight: "700" },
  statsMessage:     { fontSize: 13, color: "#94a3b8", lineHeight: 20, fontStyle: "italic" },
  extraStats:       { flexDirection: "row", gap: 16 },
  extraStat:        { alignItems: "center", gap: 2 },
  extraStatValue:   { fontSize: 18, fontWeight: "700", color: "#2563eb" },
  extraStatLabel:   { fontSize: 11, color: "#64748b" },
  weightRow:        { flexDirection: "row", gap: 16 },
  weightItem:       { alignItems: "center", gap: 2 },
  weightValue:      { fontSize: 20, fontWeight: "700", color: "#2563eb" },
  weightLabel:      { fontSize: 11, color: "#64748b" },
  noDataText:       { fontSize: 13, color: "#64748b", lineHeight: 20 },
  logoutBtn: {
    borderWidth: 1, borderColor: "#ef444440",
    borderRadius: 12, padding: 16, alignItems: "center",
    marginTop: 8,
  },
  logoutText:       { color: "#ef4444", fontSize: 15, fontWeight: "600" },
});
