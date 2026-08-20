import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { useAuthStore } from "../../stores/useAuthStore";
import { registerApi } from "../../api/auth.api";

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const setAuth = useAuthStore((s) => s.setAuth);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert("Error", "Completá los campos obligatorios");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Error", "La contraseña debe tener al menos 6 caracteres");
      return;
    }
    setLoading(true);
    try {
      const data = await registerApi({ name, email, password, phone });
      setAuth(data);
      router.replace("/(app)");
    } catch (err: any) {
      Alert.alert(
        "Error",
        err.response?.data?.error ?? "No se pudo crear la cuenta",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>MAZGym</Text>
          <Text style={styles.subtitle}>Creá tu cuenta gratis</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.title}>Registro</Text>

          <TextInput
            style={styles.input}
            placeholder="Nombre completo *"
            placeholderTextColor="#9ca3af"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />

          <TextInput
            style={styles.input}
            placeholder="Email *"
            placeholderTextColor="#9ca3af"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TextInput
            style={styles.input}
            placeholder="Contraseña * (mín. 6 caracteres)"
            placeholderTextColor="#9ca3af"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TextInput
            style={styles.input}
            placeholder="Teléfono (opcional)"
            placeholderTextColor="#9ca3af"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Crear cuenta</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkBtn}
            onPress={() => router.back()}
          >
            <Text style={styles.linkText}>
              ¿Ya tenés cuenta?{" "}
              <Text style={styles.linkBold}>Iniciá sesión</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  scroll: { flexGrow: 1, justifyContent: "center", padding: 24 },
  header: { alignItems: "center", marginBottom: 40 },
  logo: {
    fontSize: 40,
    fontWeight: "800",
    color: "#2563eb",
    letterSpacing: -1,
  },
  subtitle: { fontSize: 14, color: "#64748b", marginTop: 6 },
  form: { backgroundColor: "#1e293b", borderRadius: 20, padding: 24, gap: 16 },
  title: { fontSize: 22, fontWeight: "700", color: "#f1f5f9", marginBottom: 8 },
  input: {
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: "#f1f5f9",
  },
  button: {
    backgroundColor: "#2563eb",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  linkBtn: { alignItems: "center", paddingVertical: 8 },
  linkText: { color: "#64748b", fontSize: 14 },
  linkBold: { color: "#2563eb", fontWeight: "600" },
});
