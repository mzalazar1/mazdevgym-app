import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuthStore } from "../../stores/useAuthStore";

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  const isMember = user?.role === "member";

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.greeting}>
            ¡Hola, {user?.name?.split(" ")[0]}! 👋
          </Text>
          {isMember && user?.gymName && (
            <Text style={styles.gymName}>{user.gymName}</Text>
          )}
        </View>
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
