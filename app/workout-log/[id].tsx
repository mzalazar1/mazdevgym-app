import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";

export default function WorkoutLogDetailScreen() {
  const { data } = useLocalSearchParams<{ id: string; data: string }>();
  const log = data ? JSON.parse(data) : null;

  if (!log) return null;

  const doneAt = new Date(log.doneAt);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{log.routineName ?? "Entrenamiento"}</Text>
        <Text style={styles.meta}>
          {doneAt.toLocaleDateString("es-AR", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Datos generales */}
        {(log.durationMins || log.rpe) && (
          <View style={styles.card}>
            <View style={styles.generalRow}>
              {log.durationMins && (
                <View style={styles.generalItem}>
                  <Text style={styles.generalValue}>{log.durationMins} min</Text>
                  <Text style={styles.generalLabel}>Duración</Text>
                </View>
              )}
              {log.rpe && (
                <View style={styles.generalItem}>
                  <Text style={styles.generalValue}>{log.rpe}/10</Text>
                  <Text style={styles.generalLabel}>Esfuerzo</Text>
                </View>
              )}
            </View>
            {log.notes && <Text style={styles.notes}>{log.notes}</Text>}
          </View>
        )}

        {/* Ejercicios */}
        {log.exerciseLogs?.map((exLog: any, i: number) => (
          <View
            key={exLog.id ?? i}
            style={[styles.card, exLog.skipped && styles.cardSkipped]}
          >
            <View style={styles.exHeader}>
              <Text style={styles.exName}>
                {exLog.exercise?.name ?? exLog.exerciseName ?? `Ejercicio ${i + 1}`}
              </Text>
              {exLog.skipped && (
                <View style={styles.skippedBadge}>
                  <Text style={styles.skippedBadgeText}>Omitido</Text>
                </View>
              )}
            </View>

            {!exLog.skipped && exLog.setLogs?.length > 0 && (
              <>
                <View style={styles.setHeader}>
                  <Text style={[styles.setHeaderText, { width: 30 }]}>Serie</Text>
                  <Text style={[styles.setHeaderText, { flex: 1 }]}>Kg</Text>
                  <Text style={[styles.setHeaderText, { flex: 1 }]}>Reps</Text>
                  <Text style={[styles.setHeaderText, { flex: 1 }]}>Desc (s)</Text>
                  <Text style={[styles.setHeaderText, { width: 30 }]}>✓</Text>
                </View>
                {exLog.setLogs.map((set: any, j: number) => (
                  <View
                    key={set.id ?? j}
                    style={[styles.setRow, set.completed && styles.setRowDone]}
                  >
                    <Text style={styles.setNumber}>{set.setNumber ?? j + 1}</Text>
                    <Text style={styles.setValue}>{set.weightKg ?? "—"}</Text>
                    <Text style={styles.setValue}>{set.reps ?? "—"}</Text>
                    <Text style={styles.setValue}>{set.restSecs ?? "—"}</Text>
                    <Text style={styles.setCheck}>{set.completed ? "✓" : ""}</Text>
                  </View>
                ))}
              </>
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  header: { padding: 20, gap: 4, borderBottomWidth: 1, borderBottomColor: "#1e293b" },
  backBtn: { marginBottom: 8 },
  backText: { color: "#2563eb", fontSize: 14, fontWeight: "600" },
  title: { fontSize: 22, fontWeight: "800", color: "#f1f5f9" },
  meta: { fontSize: 13, color: "#64748b", textTransform: "capitalize" },
  scroll: { padding: 16, gap: 12, paddingBottom: 32 },
  card: {
    backgroundColor: "#1e293b",
    borderRadius: 14,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: "#334155",
  },
  cardSkipped: { opacity: 0.5 },
  generalRow: { flexDirection: "row", gap: 24 },
  generalItem: { alignItems: "center", gap: 2 },
  generalValue: { fontSize: 18, fontWeight: "700", color: "#2563eb" },
  generalLabel: { fontSize: 11, color: "#64748b" },
  notes: { fontSize: 13, color: "#94a3b8", lineHeight: 20, fontStyle: "italic" },
  exHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  exName: { fontSize: 15, fontWeight: "700", color: "#f1f5f9", flex: 1 },
  skippedBadge: {
    backgroundColor: "#f59e0b20",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  skippedBadgeText: { fontSize: 12, color: "#f59e0b", fontWeight: "600" },
  setHeader: { flexDirection: "row", gap: 8, paddingHorizontal: 4 },
  setHeaderText: { fontSize: 10, color: "#475569", fontWeight: "600", textAlign: "center" },
  setRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#0f172a",
  },
  setRowDone: { backgroundColor: "#0f2d1a" },
  setNumber: { width: 30, fontSize: 13, fontWeight: "700", color: "#64748b", textAlign: "center" },
  setValue: { flex: 1, fontSize: 14, color: "#f1f5f9", textAlign: "center" },
  setCheck: { width: 30, fontSize: 14, color: "#22c55e", textAlign: "center", fontWeight: "700" },
});
