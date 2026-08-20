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
} from "react-native";
import { router } from "expo-router";
import { useAuthStore } from "../../stores/useAuthStore";
import { loginApi } from "../../api/auth.api";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const setAuth = useAuthStore((s) => s.setAuth);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Completá todos los campos");
      return;
    }
    setLoading(true);
    try {
      const data = await loginApi({ email, password });
      setAuth(data);
      router.replace("/(app)");
    } catch (err: any) {
      Alert.alert(
        "Error",
        err.response?.data?.error ?? "Credenciales incorrectas",
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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>MAZGym</Text>
        <Text style={styles.subtitle}>Tu entrenamiento, en tu bolsillo</Text>
      </View>

      {/* Form */}
      <View style={styles.form}>
        <Text style={styles.title}>Iniciar sesión</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#9ca3af"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />

        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          placeholderTextColor="#9ca3af"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Ingresar</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkBtn}
          onPress={() => router.push("/(auth)/register")}
        >
          <Text style={styles.linkText}>
            ¿No tenés cuenta?{" "}
            <Text style={styles.linkBold}>Registrate gratis</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
    justifyContent: "center",
    padding: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 48,
  },
  logo: {
    fontSize: 40,
    fontWeight: "800",
    color: "#2563eb",
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 6,
  },
  form: {
    backgroundColor: "#1e293b",
    borderRadius: 20,
    padding: 24,
    gap: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#f1f5f9",
    marginBottom: 8,
  },
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
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  linkBtn: {
    alignItems: "center",
    paddingVertical: 8,
  },
  linkText: {
    color: "#64748b",
    fontSize: 14,
  },
  linkBold: {
    color: "#2563eb",
    fontWeight: "600",
  },
});
