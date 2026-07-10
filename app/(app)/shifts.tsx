import { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getShiftsApi, bookShiftApi, cancelShiftApi } from "../../api/app.api";
import { useAuthStore } from "../../stores/useAuthStore";

const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DAYS   = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export default function ShiftsScreen() {
  const user     = useAuthStore((s) => s.user);
  const isMember = user?.role === "member";
  const qc       = useQueryClient();

  const now   = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const from = `${year}-${String(month).padStart(2,"0")}-01`;
  const to   = `${year}-${String(month).padStart(2,"0")}-${new Date(year, month, 0).getDate()}`;

  const { data: shifts = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["app-shifts", from, to],
    queryFn:  () => getShiftsApi(from, to),
    enabled:  isMember,
  });

  const bookMutation = useMutation({
    mutationFn: bookShiftApi,
    onSuccess:  () => qc.invalidateQueries({ queryKey: ["app-shifts"] }),
    onError:    (err: any) => Alert.alert("Error", err.response?.data?.error ?? "No se pudo reservar"),
  });

  const cancelMutation = useMutation({
    mutationFn: cancelShiftApi,
    onSuccess:  () => qc.invalidateQueries({ queryKey: ["app-shifts"] }),
    onError:    (err: any) => Alert.alert("Error", err.response?.data?.error ?? "No se pudo cancelar"),
  });

  const handleBook = (shift: any) => {
    if (shift.myStatus === "confirmed" || shift.myStatus === "waitlist") {
      Alert.alert(
        "Cancelar reserva",
        `¿Cancelás tu reserva para ${shift.title}?`,
        [
          { text: "No", style: "cancel" },
          { text: "Sí, cancelar", style: "destructive", onPress: () => cancelMutation.mutate(shift.id) },
        ]
      );
    } else {
      bookMutation.mutate(shift.id);
    }
  };

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  if (!isMember) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}><Text style={styles.title}>Turnos</Text></View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📆</Text>
          <Text style={styles.emptyTitle}>Función para miembros</Text>
          <Text style={styles.emptyText}>Asociate a un gym para reservar turnos.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Turnos</Text>

        {/* Navegador de mes */}
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={prevMonth} style={styles.monthBtn}>
            <Text style={styles.monthBtnText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.monthLabel}>{MONTHS[month - 1]} {year}</Text>
          <TouchableOpacity onPress={nextMonth} style={styles.monthBtn}>
            <Text style={styles.monthBtnText}>›</Text>
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.emptyContainer}>
          <ActivityIndicator color="#2563eb" size="large" />
        </View>
      ) : shifts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📆</Text>
          <Text style={styles.emptyTitle}>Sin turnos este mes</Text>
          <Text style={styles.emptyText}>No hay turnos disponibles para {MONTHS[month - 1]}.</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#2563eb" />}
        >
          {shifts.map((shift: any) => {
            const isBooked   = shift.myStatus === "confirmed";
            const isWaitlist = shift.myStatus === "waitlist";
            const isFull     = shift.isFull && !isBooked && !isWaitlist;
            const isLoading  = bookMutation.isPending || cancelMutation.isPending;

            return (
              <View key={shift.id} style={[styles.card, isBooked && styles.cardBooked]}>
                {/* Fecha */}
                <View style={styles.dateCol}>
                  <Text style={styles.dateDay}>{new Date(shift.date).getDate()}</Text>
                  <Text style={styles.dateMonth}>{MONTHS[new Date(shift.date).getMonth()].slice(0,3)}</Text>
                  <Text style={styles.dateWeekday}>{DAYS[new Date(shift.date).getDay()]}</Text>
                </View>

                {/* Info */}
                <View style={styles.shiftInfo}>
                  <Text style={styles.shiftTitle}>{shift.title}</Text>
                  <Text style={styles.shiftTime}>
                    🕐 {shift.startTime} — {shift.endTime}
                  </Text>
                  {shift.trainer && (
                    <Text style={styles.shiftTrainer}>👤 {shift.trainer}</Text>
                  )}
                  {shift.capacity && (
                    <Text style={styles.shiftCapacity}>
                      {shift.confirmed}/{shift.capacity} confirmados
                    </Text>
                  )}
                </View>

                {/* Botón */}
                <TouchableOpacity
                  style={[
                    styles.bookBtn,
                    isBooked   && styles.bookBtnBooked,
                    isWaitlist && styles.bookBtnWait,
                    isFull     && styles.bookBtnFull,
                  ]}
                  onPress={() => handleBook(shift)}
                  disabled={isFull || isLoading}
                >
                  <Text style={[styles.bookBtnText, (isBooked || isWaitlist) && styles.bookBtnTextAlt]}>
                    {isBooked   ? "✓ Reservado" :
                     isWaitlist ? "En espera"   :
                     isFull     ? "Sin cupos"   : "Reservar"}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: "#0f172a" },
  header:         { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, gap: 12 },
  title:          { fontSize: 28, fontWeight: "800", color: "#f1f5f9" },
  monthNav:       { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  monthBtn:       { padding: 8 },
  monthBtnText:   { fontSize: 28, color: "#2563eb", fontWeight: "300" },
  monthLabel:     { fontSize: 16, fontWeight: "700", color: "#f1f5f9" },
  scroll:         { padding: 16, gap: 12 },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12, padding: 32 },
  emptyIcon:      { fontSize: 48 },
  emptyTitle:     { fontSize: 18, fontWeight: "700", color: "#f1f5f9", textAlign: "center" },
  emptyText:      { fontSize: 14, color: "#64748b", textAlign: "center", lineHeight: 20 },
  card: {
    backgroundColor: "#1e293b",
    borderRadius:    16,
    padding:         16,
    flexDirection:   "row",
    alignItems:      "center",
    gap:             12,
    borderWidth:     1,
    borderColor:     "#334155",
  },
  cardBooked:     { borderColor: "#2563eb" },
  dateCol:        { alignItems: "center", width: 44 },
  dateDay:        { fontSize: 22, fontWeight: "800", color: "#f1f5f9" },
  dateMonth:      { fontSize: 11, color: "#64748b", fontWeight: "600" },
  dateWeekday:    { fontSize: 11, color: "#64748b" },
  shiftInfo:      { flex: 1, gap: 3 },
  shiftTitle:     { fontSize: 15, fontWeight: "700", color: "#f1f5f9" },
  shiftTime:      { fontSize: 12, color: "#64748b" },
  shiftTrainer:   { fontSize: 12, color: "#64748b" },
  shiftCapacity:  { fontSize: 12, color: "#64748b" },
  bookBtn: {
    backgroundColor: "#2563eb",
    borderRadius:    10,
    paddingVertical:   8,
    paddingHorizontal: 12,
    alignItems:      "center",
    minWidth:        80,
  },
  bookBtnBooked:   { backgroundColor: "#0f172a", borderWidth: 1, borderColor: "#2563eb" },
  bookBtnWait:     { backgroundColor: "#f59e0b20", borderWidth: 1, borderColor: "#f59e0b" },
  bookBtnFull:     { backgroundColor: "#334155" },
  bookBtnText:     { color: "#fff", fontSize: 12, fontWeight: "700" },
  bookBtnTextAlt:  { color: "#2563eb" },
});
