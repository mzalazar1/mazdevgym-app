import { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { logBodyProgressApi } from "../api/app.api";

interface Field {
  key:         string;
  label:       string;
  unit:        string;
  placeholder: string;
}

const FIELDS: Field[] = [
  { key: "weightKg",   label: "Peso",            unit: "kg",  placeholder: "78.5" },
  { key: "bodyFatPct", label: "Grasa corporal",   unit: "%",   placeholder: "18.5" },
  { key: "waistCm",    label: "Cintura",          unit: "cm",  placeholder: "85" },
  { key: "hipCm",      label: "Cadera",           unit: "cm",  placeholder: "95" },
  { key: "chestCm",    label: "Pecho",            unit: "cm",  placeholder: "100" },
  { key: "armCm",      label: "Brazo",            unit: "cm",  placeholder: "35" },
  { key: "thighCm",    label: "Muslo",            unit: "cm",  placeholder: "55" },
];

export default function LogProgressScreen() {
  const qc = useQueryClient();
  const [values, setValues] = useState<Record<string, string>>({});
  const [notes,  setNotes]  = useState("");

  const mutation = useMutation({
    mutationFn: logBodyProgressApi,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["app-body-progress"] });
      Alert.alert("✅ Progreso registrado", "Tus medidas fueron guardadas.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    },
    onError: (err: any) => {
      Alert.alert("Error", err.response?.data?.error ?? "No se pudo guardar");
    },
  });

  const handleSave = () => {
    const hasValues = Object.values(values).some(v => v.trim() !== "");
    if (!hasValues) {
      Alert.alert("Error", "Completá al menos una medida");
      return;
    }

    const data: Record<string, any> = { notes: notes || null };
    FIELDS.forEach(({ key }) => {
      if (values[key]?.trim()) {
        data[key] = Number(values[key]);
      }
    });

    mutation.mutate(data);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Registrar progreso</Text>
        <Text style={styles.subtitle}>
          Completá solo las medidas que querés registrar hoy
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Medidas */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Medidas corporales</Text>
          {FIELDS.map(({ key, label, unit, placeholder }) => (
            <View key={key} style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>{label}</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={values[key] ?? ""}
                  onChangeText={(v) => setValues(prev => ({ ...prev, [key]: v }))}
                  keyboardType="decimal-pad"
                  placeholder={placeholder}
                  placeholderTextColor="#475569"
                />
                <Text style={styles.unit}>{unit}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Notas */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Notas (opcional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Ej: inicio de mes, después de vacaciones..."
            placeholderTextColor="#475569"
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Botón guardar */}
        <TouchableOpacity
          style={[styles.saveBtn, mutation.isPending && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={mutation.isPending}
        >
          {mutation.isPending
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.saveBtnText}>📊 Guardar medidas</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  header:    { padding: 20, gap: 4, borderBottomWidth: 1, borderBottomColor: "#1e293b" },
  backText:  { color: "#2563eb", fontSize: 14, fontWeight: "600", marginBottom: 8 },
  title:     { fontSize: 24, fontWeight: "800", color: "#f1f5f9" },
  subtitle:  { fontSize: 13, color: "#64748b", marginTop: 2 },
  scroll:    { padding: 16, gap: 12, paddingBottom: 40 },
  card: {
    backgroundColor: "#1e293b",
    borderRadius:    14,
    padding:         16,
    gap:             12,
    borderWidth:     1,
    borderColor:     "#334155",
  },
  cardTitle:    { fontSize: 15, fontWeight: "700", color: "#f1f5f9", marginBottom: 4 },
  fieldRow:     { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  fieldLabel:   { fontSize: 14, color: "#94a3b8", flex: 1 },
  inputWrapper: { flexDirection: "row", alignItems: "center", gap: 8 },
  input: {
    backgroundColor: "#0f172a",
    borderWidth:     1,
    borderColor:     "#334155",
    borderRadius:    10,
    padding:         10,
    color:           "#f1f5f9",
    fontSize:        15,
    width:           90,
    textAlign:       "right",
  },
  unit:     { fontSize: 13, color: "#64748b", width: 24 },
  textArea: { width: "100%", minHeight: 70, textAlignVertical: "top", textAlign: "left" },
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
