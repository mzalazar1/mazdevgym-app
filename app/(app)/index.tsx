import { useCallback, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../../stores/useAuthStore";
import { getAnnouncementsApi } from "../../api/app.api";
import AnnouncementsBoard from "../../components/AnnouncementsBoard";

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  const isMember = user?.role === "member";
  const hasGym = !!user?.gymId;

  const { data, refetch } = useQuery({
    queryKey: ["app-announcements"],
    queryFn: getAnnouncementsApi,
    enabled: hasGym,
  });
  // Si falla un refresco se siguen mostrando los últimos avisos cargados;
  // si falla la primera carga no hay data y el cartel no se muestra.
  const announcements = data ?? [];

  // El tab queda montado y staleTime es de 5 min: refrescamos al volver a Inicio.
  // El primer foco se saltea porque la query ya se dispara al montar.
  const isFirstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (isFirstFocus.current) {
        isFirstFocus.current = false;
        return;
      }
      if (hasGym) refetch();
    }, [hasGym, refetch])
  );

  // Estado propio (no isRefetching) para que el spinner solo aparezca al arrastrar,
  // no en cada refresco por foco.
  const [manualRefreshing, setManualRefreshing] = useState(false);
  const onRefresh = async () => {
    if (!hasGym) return;
    setManualRefreshing(true);
    await refetch();
    setManualRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={manualRefreshing} onRefresh={onRefresh} tintColor="#2563eb" />
        }
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>
            ¡Hola, {user?.name?.split(" ")[0]}! 👋
          </Text>
          {isMember && user?.gymName && (
            <Text style={styles.gymName}>{user.gymName}</Text>
          )}
        </View>
        <AnnouncementsBoard announcements={announcements} />
        <View style={styles.grid}>
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push("/(app)/routines")}
          >
            <Text style={styles.cardIcon}>💪</Text>
            <Text style={styles.cardLabel}>Rutinas</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push("/(app)/shifts")}
          >
            <Text style={styles.cardIcon}>📅</Text>
            <Text style={styles.cardLabel}>Turnos</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push("/(app)/shop")}
          >
            <Text style={styles.cardIcon}>🛒</Text>
            <Text style={styles.cardLabel}>Tienda</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push("/(app)/profile")}
          >
            <Text style={styles.cardIcon}>📊</Text>
            <Text style={styles.cardLabel}>Mi progreso</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  scroll: { padding: 20, gap: 20 },
  header: { paddingVertical: 8 },
  greeting: { fontSize: 24, fontWeight: "800", color: "#f1f5f9" },
  gymName: { fontSize: 14, color: "#2563eb", marginTop: 2, fontWeight: "600" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 20 },
  card: {
    backgroundColor: "#1e293b",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    gap: 8,
    width: "47%",
    borderWidth: 1,
    borderColor: "#334155",
  },
  cardIcon: { fontSize: 32 },
  cardLabel: {
    fontSize: 13,
    color: "#94a3b8",
    fontWeight: "600",
    textAlign: "center",
  },
});
