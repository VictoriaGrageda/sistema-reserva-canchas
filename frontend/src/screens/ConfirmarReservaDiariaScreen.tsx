import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import colors from "../theme/colors";
import Footer from "../components/Footer";
import type { NavProps } from "../navigation/types";
import { ReservasAPI } from "../api/reservas";

export default function ConfirmarReservaDiariaScreen({
  navigation,
  route,
}: NavProps<"ConfirmarReserva">) {
  const { cancha, complejo, horarios } = route.params;
  const [loading, setLoading] = useState(false);

  const totalDiario = useMemo(
    () => horarios.reduce((sum, h) => sum + (h.precio || 0), 0),
    [horarios]
  );

  const confirmar = async () => {
    setLoading(true);
    try {
      const resp = await ReservasAPI.crear({
        horarios: horarios.map((x) => ({ horario_id: x.id, precio: x.precio })),
        tipo_reserva: "diaria",
      });
      const reservaId = resp?.data?.id || resp?.id;
      if (!reservaId) {
        throw new Error("No se obtuvo el ID de la reserva");
      }
      Alert.alert("Reserva creada", "Tu reserva ha sido creada correctamente.", [
        { text: "Ver QR", onPress: () => navigation.replace("DetalleReservaQR", { reserva_id: reservaId }) },
      ]);
    } catch (e: any) {
      Alert.alert("Error", e?.response?.data?.message || e?.message || "No se pudo crear la reserva");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={colors.green} />
      <Footer />

      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={colors.dark} />
          <Text style={styles.backText}>Volver</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Confirmar Reserva</Text>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name={complejo ? "business" : "grid"} size={28} color={colors.green} />
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{complejo ? complejo.nombre : cancha.nombre}</Text>
              {complejo && <Text style={styles.cardSubtitle}>{cancha.nombre}</Text>}
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="resize" size={16} color={colors.dark} />
            <Text style={styles.infoText}>{cancha.tipoCancha}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="leaf" size={16} color={colors.dark} />
            <Text style={styles.infoText}>{cancha.tipoCampo}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="today" size={24} color={colors.green} />
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Horarios seleccionados</Text>
              <Text style={styles.cardSubtitle}>Resumen diario</Text>
            </View>
          </View>
          {horarios.map((h) => (
            <View key={h.id} style={styles.horarioRow}>
              <Text style={styles.horarioText}>
                {h.fecha} • {h.hora_inicio.substring(0, 5)}-{h.hora_fin.substring(0, 5)}
              </Text>
              <Text style={styles.horarioPrecio}>{h.precio} Bs</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalCard}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total a Pagar:</Text>
            <Text style={styles.totalValue}>{totalDiario} Bs</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.confirmBtn, loading && { opacity: 0.6 }]}
          onPress={confirmar}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.confirmText}>CONFIRMAR RESERVA</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.lightGreen },
  content: { padding: 20, gap: 12 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  backText: { color: colors.dark, fontWeight: '700' },
  title: { fontSize: 22, fontWeight: '800', color: colors.dark },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 14, gap: 8, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6, borderBottomWidth: 1, borderBottomColor: '#E6F1E9', paddingBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: colors.dark },
  cardSubtitle: { fontSize: 12, color: colors.dark, opacity: 0.7 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoText: { color: colors.dark, fontWeight: '600' },
  horarioRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },
  horarioText: { color: colors.dark },
  horarioPrecio: { color: colors.green, fontWeight: '800' },
  totalCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  totalLabel: { color: colors.dark, fontWeight: '700' },
  totalValue: { color: colors.green, fontWeight: '800', fontSize: 18 },
  confirmBtn: { backgroundColor: colors.green, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingVertical: 14 },
  confirmText: { color: '#fff', fontWeight: '800' },
});
