import { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRoutineDetailApi, logWorkoutApi } from "../../api/app.api";

interface SetData {
  setNumber: number;
  weightKg:  string;
  reps:      string;
  restSecs:  string;
  completed: boolean;
}

interface ExerciseData {
  exerciseId: string;
  order:      number;
  skipped:    boolean;
  sets:       SetData[];
}

export default function LogWorkoutScreen() {
  const { routineId } = useLocalSearchParams<{ routineId: string }>();
  const qc = useQueryClient();

  const { data: routine, isLoading } = useQuery({
    queryKey: ["app-routine", routineId],
    queryFn:  () => getRoutineDetailApi(routineId!),
    enabled:  !!routineId,
  });

  const [durationMins, setDurationMins] = useState("");
  const [rpe,          setRpe]          = useState("");
  const [notes,        setNotes]        = useState("");
  const [exercises,    setExercises]    = useState<Record<string, ExerciseData>>({});

  // Inicializar ejercicios cuando carga la rutina
  const initExercises = (routine: any) => {
    const init: Record<string, ExerciseData> = {};
    routine.exercises?.forEach((ex: any, i: number) => {
      init[ex.id] = {
        exerciseId: ex.id,
        order:      i,
        skipped:    false,
        sets: Array.from({ length: ex.sets }, (_, j) => ({
          setNumber: j + 1,
          weightKg:  "",
          reps:      String(ex.reps),
          restSecs:  String(ex.rest),
          completed: false,
        })),
      };
    });
    return init;
  };

  // Inicializar al cargar
  if (routine && Object.keys(exercises).length === 0) {
    setExercises(initExercises(routine));
  }

  const updateSet = (exId: string, setIdx: number, field: keyof SetData, value: any) => {
    setExercises(prev => ({
      ...prev,
      [exId]: {
        ...prev[exId],
        sets: prev[exId].sets.map((s, i) =>
          i === setIdx ? { ...s, [field]: value } : s
        ),
      },
    }));
  };

  const toggleSkip = (exId: string) => {
    setExercises(prev => ({
      ...prev,
      [exId]: { ...prev[exId], skipped: !prev[exId].skipped },
    }));
  };

  const logMutation = useMutation({
    mutationFn: logWorkoutApi,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["app-stats"] });
      qc.invalidateQueries({ queryKey: ["app-workouts"] });
      Alert.alert("✅ ¡Entrenamiento registrado!", "Excelente trabajo 💪", [
        { text: "OK", onPress: () => router.back() },
      ]);
    },
    onError: (err: any) => {
      Alert.alert("Error", err.response?.data?.error ?? "No se pudo registrar");
    },
  });

  const handleSave = () => {
    if (!routine) return;

    const exerciseList = Object.values(exercises).map(ex => ({
      exerciseId: ex.exerciseId,
      order:      ex.order,
      skipped:    ex.skipped,
      sets: ex.sets.map(s => ({
        setNumber: s.setNumber,
        weightKg:  s.weightKg ? Number(s.weightKg) : null,
        reps:      s.reps     ? Number(s.reps)     : null,
        restSecs:  s.restSecs ? Number(s.restSecs) : null,
        completed: s.completed,
      })),
    }));

    logMutation.mutate({
      routineId:   routine.id,
      doneAt:      new Date().toISOString(),
      completed:   true,
      durationMins: durationMins ? Number(durationMins) : null,
      rpe:          rpe          ? Number(rpe)          : null,
      notes:        notes        || null,
      exercises:    exerciseList,
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
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
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Cancelar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{routine.name}</Text>
        <Text style={styles.subtitle}>Registrar entrenamiento</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Info general */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Datos generales</Text>
          <View style={styles.row}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Duración (min)</Text>
              <TextInput
                style={styles.input}
                value={durationMins}
                onChangeText={setDurationMins}
                keyboardType="numeric"
                placeholder="45"
                placeholderTextColor="#475569"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Esfuerzo (1-10)</Text>
              <TextInput
                style={styles.input}
                value={rpe}
                onChangeText={setRpe}
                keyboardType="numeric"
                placeholder="7"
                placeholderTextColor="#475569"
                maxLength={2}
              />
            </View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Notas (opcional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="¿Cómo te sentiste?"
              placeholderTextColor="#475569"
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* Ejercicios */}
        {routine.exercises?.map((ex: any) => {
          const exData = exercises[ex.id];
          if (!exData) return null;

          return (
            <View key={ex.id} style={[styles.card, exData.skipped && styles.cardSkipped]}>
              {/* Header ejercicio */}
              <View style={styles.exHeader}>
                <Text style={styles.exName}>{ex.name}</Text>
                <TouchableOpacity
                  style={[styles.skipBtn, exData.skipped && styles.skipBtnActive]}
                  onPress={() => toggleSkip(ex.id)}
                >
                  <Text style={[styles.skipBtnText, exData.skipped && styles.skipBtnTextActive]}>
                    {exData.skipped ? "Omitido" : "Omitir"}
                  </Text>
                </TouchableOpacity>
              </View>

              {!exData.skipped && (
                <>
                  {/* Headers de columnas */}
                  <View style={styles.setHeader}>
                    <Text style={[styles.setHeaderText, { width: 30 }]}>Serie</Text>
                    <Text style={[styles.setHeaderText, { flex: 1 }]}>Kg</Text>
                    <Text style={[styles.setHeaderText, { flex: 1 }]}>Reps</Text>
                    <Text style={[styles.setHeaderText, { flex: 1 }]}>Desc (s)</Text>
                    <Text style={[styles.setHeaderText, { width: 40 }]}>✓</Text>
                  </View>

                  {/* Series */}
                  {exData.sets.map((set, idx) => (
                    <View key={idx} style={[styles.setRow, set.completed && styles.setRowDone]}>
                      <Text style={styles.setNumber}>{set.setNumber}</Text>
                      <TextInput
                        style={styles.setInput}
                        value={set.weightKg}
                        onChangeText={(v) => updateSet(ex.id, idx, "weightKg", v)}
                        keyboardType="decimal-pad"
                        placeholder="—"
                        placeholderTextColor="#475569"
                      />
                      <TextInput
                        style={styles.setInput}
                        value={set.reps}
                        onChangeText={(v) => updateSet(ex.id, idx, "reps", v)}
                        keyboardType="numeric"
                        placeholder="—"
                        placeholderTextColor="#475569"
                      />
                      <TextInput
                        style={styles.setInput}
                        value={set.restSecs}
                        onChangeText={(v) => updateSet(ex.id, idx, "restSecs", v)}
                        keyboardType="numeric"
                        placeholder="—"
                        placeholderTextColor="#475569"
                      />
                      <TouchableOpacity
                        style={[styles.checkBtn, set.completed && styles.checkBtnDone]}
                        onPress={() => updateSet(ex.id, idx, "completed", !set.completed)}
                      >
                        <Text style={styles.checkBtnText}>{set.completed ? "✓" : ""}</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </>
              )}
            </View>
          );
        })}

        {/* Botón guardar */}
        <TouchableOpacity
          style={[styles.saveBtn, logMutation.isPending && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={logMutation.isPending}
        >
          {logMutation.isPending
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.saveBtnText}>💪 Guardar entrenamiento</Text>
          }
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: "#0f172a" },
  center:          { flex: 1, justifyContent: "center", alignItems: "center" },
  header:          { padding: 20, gap: 4, borderBottomWidth: 1, borderBottomColor: "#1e293b" },
  backText:        { color: "#ef4444", fontSize: 14, fontWeight: "600", marginBottom: 8 },
  title:           { fontSize: 22, fontWeight: "800", color: "#f1f5f9" },
  subtitle:        { fontSize: 13, color: "#64748b" },
  scroll:          { padding: 16, gap: 12, paddingBottom: 40 },
  card: {
    backgroundColor: "#1e293b",
    borderRadius:    14,
    padding:         16,
    gap:             12,
    borderWidth:     1,
    borderColor:     "#334155",
  },
  cardSkipped:     { opacity: 0.5 },
  cardTitle:       { fontSize: 15, fontWeight: "700", color: "#f1f5f9" },
  row:             { flexDirection: "row", gap: 12 },
  inputGroup:      { flex: 1, gap: 6 },
  inputLabel:      { fontSize: 12, color: "#64748b", fontWeight: "600" },
  input: {
    backgroundColor: "#0f172a",
    borderWidth:     1,
    borderColor:     "#334155",
    borderRadius:    10,
    padding:         12,
    color:           "#f1f5f9",
    fontSize:        15,
  },
  textArea:        { minHeight: 70, textAlignVertical: "top" },
  exHeader:        { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  exName:          { fontSize: 15, fontWeight: "700", color: "#f1f5f9", flex: 1 },
  skipBtn:         { borderWidth: 1, borderColor: "#334155", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  skipBtnActive:   { borderColor: "#f59e0b", backgroundColor: "#f59e0b20" },
  skipBtnText:     { fontSize: 12, color: "#64748b", fontWeight: "600" },
  skipBtnTextActive: { color: "#f59e0b" },
  setHeader:       { flexDirection: "row", gap: 8, paddingHorizontal: 4 },
  setHeaderText:   { fontSize: 10, color: "#475569", fontWeight: "600", textAlign: "center" },
  setRow: {
    flexDirection:   "row",
    gap:             8,
    alignItems:      "center",
    padding:         8,
    borderRadius:    8,
    backgroundColor: "#0f172a",
  },
  setRowDone:      { backgroundColor: "#0f2d1a" },
  setNumber:       { width: 30, fontSize: 13, fontWeight: "700", color: "#64748b", textAlign: "center" },
  setInput: {
    flex:            1,
    backgroundColor: "#1e293b",
    borderWidth:     1,
    borderColor:     "#334155",
    borderRadius:    8,
    padding:         8,
    color:           "#f1f5f9",
    fontSize:        14,
    textAlign:       "center",
  },
  checkBtn: {
    width:           36,
    height:          36,
    borderRadius:    8,
    borderWidth:     1,
    borderColor:     "#334155",
    justifyContent:  "center",
    alignItems:      "center",
  },
  checkBtnDone:    { backgroundColor: "#22c55e", borderColor: "#22c55e" },
  checkBtnText:    { color: "#fff", fontSize: 16, fontWeight: "700" },
  saveBtn: {
    backgroundColor: "#2563eb",
    borderRadius:    14,
    padding:         18,
    alignItems:      "center",
    marginTop:       8,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText:     { color: "#fff", fontSize: 16, fontWeight: "700" },
});
