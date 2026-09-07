import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useVideoPlayer, VideoView } from "expo-video";
import { getRoutineDetailApi } from "../../api/app.api";

const LEVEL_LABEL: Record<string, string> = {
  beginner: "Principiante",
  intermediate: "Intermedio",
  advanced: "Avanzado",
};

export default function RoutineDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [selectedExercise, setSelectedExercise] = useState<any>(null);

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
            {/* GIF, imagen o video */}
            {(() => {
              const thumbUrl = ex.gifUrl || ex.imageUrl;
              const isVideo = ex.mediaType === "video" && !!ex.videoUrl;
              if (!isVideo && !thumbUrl) {
                return (
                  <View style={styles.exNumber}>
                    <Text style={styles.exNumberText}>{i + 1}</Text>
                  </View>
                );
              }
              return (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setSelectedExercise(ex)}
                >
                  {thumbUrl ? (
                    <Image
                      source={{ uri: thumbUrl }}
                      style={styles.exGif}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.exGif, styles.exVideoPlaceholder]} />
                  )}
                  {isVideo ? (
                    <View style={styles.exPlayOverlay}>
                      <Text style={styles.exPlayIcon}>▶</Text>
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            })()}

            {/* Info */}
            <View style={styles.exInfo}>
              <Text style={styles.exName} numberOfLines={2}>
                {ex.name}
              </Text>
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

      <ExerciseMediaModal
        exercise={selectedExercise}
        visible={!!selectedExercise}
        onClose={() => setSelectedExercise(null)}
      />
    </SafeAreaView>
  );
}

function ExerciseMediaModal({
  exercise,
  visible,
  onClose,
}: {
  exercise: any;
  visible: boolean;
  onClose: () => void;
}) {
  const isVideo = exercise?.mediaType === "video" && !!exercise?.videoUrl;
  const player = useVideoPlayer(isVideo ? exercise.videoUrl : "", (p) => {
    p.loop = false;
  });

  useEffect(() => {
    if (visible && isVideo) {
      player.play();
    } else {
      player.pause();
    }
  }, [visible, isVideo, player]);

  if (!exercise) return null;

  const imageUrl = exercise.gifUrl || exercise.imageUrl;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <TouchableOpacity style={styles.modalCloseBtn} onPress={onClose}>
          <Text style={styles.modalCloseText}>✕</Text>
        </TouchableOpacity>

        <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
          {isVideo ? (
            <VideoView
              style={styles.modalVideo}
              player={player}
              allowsFullscreen
              nativeControls
            />
          ) : imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.modalImage}
              resizeMode="contain"
            />
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
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
  exGif: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: "#334155",
    flexShrink: 0,
  },
  exVideoPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  exPlayOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#00000055",
    borderRadius: 10,
  },
  exPlayIcon: { color: "#fff", fontSize: 18 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "#000000d9",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCloseBtn: {
    position: "absolute",
    top: 56,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ffffff22",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  modalCloseText: { color: "#fff", fontSize: 20, fontWeight: "700" },
  modalContent: {
    width: "90%",
    height: "70%",
    justifyContent: "center",
    alignItems: "center",
  },
  modalImage: { width: "100%", height: "100%" },
  modalVideo: { width: "100%", height: "100%" },
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
