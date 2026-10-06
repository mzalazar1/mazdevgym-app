import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import type { Announcement } from "../api/app.api";

const VISIBLE_COUNT = 3;

export default function AnnouncementsBoard({ announcements }: { announcements: Announcement[] }) {
  const [expanded, setExpanded] = useState(false);

  if (announcements.length === 0) return null;

  const visible = expanded ? announcements : announcements.slice(0, VISIBLE_COUNT);
  const hasMore = announcements.length > VISIBLE_COUNT;

  return (
    <View style={styles.board}>
      <Text style={styles.title}>Avisos</Text>

      {visible.map((a) => (
        <View key={a.id} style={[styles.card, a.urgent && styles.cardUrgent]}>
          {(a.urgent || a.targetMemberId) && (
            <View style={styles.tagsRow}>
              {a.urgent && <Text style={styles.urgentLabel}>⚠️ Urgente</Text>}
              {a.targetMemberId && (
                <View style={styles.forYouTag}>
                  <Text style={styles.forYouText}>Para vos</Text>
                </View>
              )}
            </View>
          )}
          {/* Sin numberOfLines: los mensajes (hasta 500 caracteres) se leen completos */}
          <Text style={styles.message}>{a.message}</Text>
        </View>
      ))}

      {hasMore && (
        <TouchableOpacity onPress={() => setExpanded((v) => !v)} style={styles.moreBtn}>
          <Text style={styles.moreText}>
            {expanded ? "Ver menos" : `Ver todos (${announcements.length})`}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  board: { gap: 10 },
  title: { fontSize: 16, fontWeight: "700", color: "#f1f5f9" },
  card: {
    backgroundColor: "#1e293b",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#334155",
    borderLeftWidth: 4,
    borderLeftColor: "#2563eb",
    padding: 14,
    gap: 8,
  },
  cardUrgent: { borderLeftColor: "#ef4444" },
  tagsRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  urgentLabel: { fontSize: 12, fontWeight: "700", color: "#ef4444" },
  forYouTag: {
    backgroundColor: "#172554",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  forYouText: { fontSize: 11, fontWeight: "700", color: "#93c5fd" },
  message: { fontSize: 14, color: "#e2e8f0", lineHeight: 20 },
  moreBtn: { alignSelf: "center", paddingVertical: 6, paddingHorizontal: 12 },
  moreText: { fontSize: 13, fontWeight: "600", color: "#2563eb" },
});
