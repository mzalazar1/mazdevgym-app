import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { getRoutineDetailApi } from "../../api/app.api";

const LEVEL_LABEL: Record<string, string> = {
  beginner: "Principiante",
  intermediate: "Intermedio",
  advanced: "Avanzado",
};

export default function RoutineDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: routine, isLoading } = useQuery({
    queryKey: ["app-routine", id],
    queryFn: () => getRoutineDetailApi(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#2563eb" size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (!routine) return null;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{routine.name}</Text>
        <Text style={styles.meta}>
          {LEVEL_LABEL[routine.level] ?? routine.level}
          {routine.days?.length > 0 ? ` · ${routine.days.join(", ")}` : ""}
        </Text>
        {routine.description ? (
          <Text style={styles.description}>{routine.description}</Text>
        ) : null}
      </View>

      {/* Ejercicios */}
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.sectionTitle}>
          {routine.exercises?.length ?? 0} Ejercicios
        </Text>

        {routine.exercises?.map((ex: any, i: number) => (
          <View key={ex.id} style={styles.exerciseCard}>
            {/* Número */}
            <View style={styles.exNumber}>
              <Text style={styles.exNumberText}>{i + 1}</Text>
            </View>

            {/* Info */}
            <View style={styles.exInfo}>
              <Text style={styles.exName}>{ex.name}</Text>
              <View style={styles.exStats}>
                <View style={styles.statChip}>
                  <Text style={styles.statValue}>{ex.sets}</Text>
                  <Text style={styles.statLabel}>series</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statChip}>
                  <Text style={styles.statValue}>{ex.reps}</Text>
                  <Text style={styles.statLabel}>{ex.unit ?? "reps"}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statChip}>
                  <Text style={styles.statValue}>{ex.rest}s</Text>
                  <Text style={styles.statLabel}>descanso</Text>
                </View>
              </View>
            </View>
          </View>
        ))}

        {/* Botón registrar entrenamiento */}
        <TouchableOpacity
          style={styles.logBtn}
          onPress={() => router.push(`/log-workout/${routine.id}` as any)}
        >
          <Text style={styles.logBtnText}>💪 Registrar entrenamiento</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    padding: 20,
    gap: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
  },
  backBtn: { marginBottom: 8 },
  backText: { color: "#2563eb", fontSize: 14, fontWeight: "600" },
  title: { fontSize: 26, fontWeight: "800", color: "#f1f5f9" },
  meta: { fontSize: 13, color: "#64748b", marginTop: 2 },
  description: { fontSize: 14, color: "#94a3b8", marginTop: 6, lineHeight: 20 },
  scroll: { padding: 20, gap: 12 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#94a3b8",
    marginBottom: 4,
  },
  exerciseCard: {
    backgroundColor: "#1e293b",
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    gap: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#334155",
  },
  exNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#2563eb20",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  exNumberText: { fontSize: 15, fontWeight: "700", color: "#2563eb" },
  exInfo: { flex: 1, gap: 8 },
  exName: { fontSize: 16, fontWeight: "600", color: "#f1f5f9" },
  exStats: { flexDirection: "row", alignItems: "center", gap: 8 },
  statChip: { alignItems: "center" },
  statValue: { fontSize: 15, fontWeight: "700", color: "#2563eb" },
  statLabel: { fontSize: 10, color: "#64748b" },
  statDivider: { width: 1, height: 20, backgroundColor: "#334155" },
  logBtn: {
    backgroundColor: "#2563eb",
    borderRadius: 14,
    padding: 18,
    alignItems: "center",
    marginTop: 12,
  },
  logBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
