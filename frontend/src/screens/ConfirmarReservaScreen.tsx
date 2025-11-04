import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import colors from "../theme/colors";
import Footer from "../components/Footer";
import type { NavProps } from "../navigation/types";
import { ReservasAPI } from "../api/reservas";

export default function ConfirmarReservaScreen({
  navigation,
  route,
}: NavProps<"ConfirmarReserva">) {
  const { cancha, complejo, horarios } = route.params;
  const [loading, setLoading] = useState(false);

  const calcularTotal = () => {
    return horarios.reduce((sum, h) => sum + h.precio, 0);
  };

  const confirmarReserva = async () => {
    setLoading(true);
    try {
      const payload = {
        horarios: horarios.map((h) => ({
          horario_id: h.id,
          precio: h.precio,
        })),
      };

      const response = await ReservasAPI.crear(payload);

      // Obtener el ID de la reserva creada
      const reservaId = response.id || response.data?.id;

      Alert.alert(
        "¡Reserva Exitosa!",
        "Tu reserva ha sido creada correctamente.",
        [
          {
            text: "Ver QR de Pago",
            onPress: () => {
              navigation.replace("DetalleReservaQR", { reserva_id: reservaId });
            },
          },
        ]
      );
    } catch (error: any) {
      console.error("Error al crear reserva:", error);
      Alert.alert(
        "Error",
        error.response?.data?.message || "No se pudo crear la reserva."
      );
    } finally {
      setLoading(false);
    }
  };

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      FUT5: "Fútbol 5",
      FUT6: "Fútbol 6",
      FUT8: "Fútbol 8",
      FUT11: "Fútbol 11",
      SINTETICO: "Césped Sintético",
      TIERRA: "Tierra Batida",
      CESPED: "Césped Natural",
    };
    return labels[tipo] || tipo;
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={colors.green} />
      <Footer />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Header con botón volver */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.85}
        >
          <Ionicons name="arrow-back" size={20} color={colors.dark} />
          <Text style={styles.backText}>Volver</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Confirmar Reserva</Text>

        {/* Card de la cancha */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons
              name={complejo ? "business" : "grid"}
              size={28}
              color={colors.green}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>
                {complejo ? complejo.nombre : cancha.nombre}
              </Text>
              {complejo && (
                <Text style={styles.cardSubtitle}>{cancha.nombre}</Text>
              )}
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="resize" size={16} color={colors.dark} />
            <Text style={styles.infoText}>
              {getTipoLabel(cancha.tipoCancha)}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="leaf" size={16} color={colors.dark} />
            <Text style={styles.infoText}>
              {getTipoLabel(cancha.tipoCampo)}
            </Text>
          </View>
        </View>

        {/* Horarios seleccionados */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Horarios Seleccionados ({horarios.length})
          </Text>

          {horarios.map((horario, index) => (
            <View key={horario.id} style={styles.horarioCard}>
              <View style={styles.horarioInfo}>
                <Ionicons name="calendar" size={16} color={colors.green} />
                <Text style={styles.horarioFecha}>
                  {new Date(horario.fecha).toLocaleDateString("es-ES", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </Text>
              </View>

              <View style={styles.horarioInfo}>
                <Ionicons name="time" size={16} color={colors.green} />
                <Text style={styles.horarioHora}>
                  {horario.hora_inicio.substring(0, 5)} -{" "}
                  {horario.hora_fin.substring(0, 5)}
                </Text>
              </View>

              <Text style={styles.horarioPrecio}>{horario.precio} Bs</Text>
            </View>
          ))}
        </View>

        {/* Total */}
        <View style={styles.totalCard}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalValue}>{calcularTotal()} Bs</Text>
          </View>

          <View style={[styles.totalRow, { marginTop: 8 }]}>
            <Text style={styles.totalLabelFinal}>Total a Pagar:</Text>
            <Text style={styles.totalValueFinal}>{calcularTotal()} Bs</Text>
          </View>
        </View>

        {/* Nota informativa */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={20} color="#2196F3" />
          <Text style={styles.infoCardText}>
            Después de confirmar, podrás ver el QR de pago y realizar la
            transferencia. El administrador confirmará tu pago.
          </Text>
        </View>

        {/* Botón confirmar */}
        <TouchableOpacity
          style={[styles.confirmarBtn, loading && { opacity: 0.6 }]}
          onPress={confirmarReserva}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.confirmarText}>CONFIRMAR RESERVA</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.lightGreen,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    gap: 16,
  },

  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
    borderRadius: 20,
    marginBottom: 4,
  },
  backText: {
    color: colors.dark,
    fontWeight: "700",
    fontSize: 14,
  },

  title: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.dark,
    marginBottom: 8,
  },

  // Card de cancha
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E6F1E9",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.dark,
  },
  cardSubtitle: {
    fontSize: 14,
    color: colors.dark,
    opacity: 0.7,
    marginTop: 2,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  infoText: {
    fontSize: 14,
    color: colors.dark,
    opacity: 0.8,
  },

  // Sección
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.dark,
    marginBottom: 4,
  },

  // Horarios
  horarioCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    gap: 8,
  },
  horarioInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  horarioFecha: {
    fontSize: 14,
    color: colors.dark,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  horarioHora: {
    fontSize: 14,
    color: colors.dark,
    fontWeight: "700",
  },
  horarioPrecio: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.green,
    alignSelf: "flex-end",
    marginTop: 4,
  },

  // Total
  totalCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 14,
    color: colors.dark,
    opacity: 0.7,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.dark,
  },
  totalLabelFinal: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.dark,
  },
  totalValueFinal: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.green,
  },

  // Info card
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#E3F2FD",
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: "#2196F3",
  },
  infoCardText: {
    flex: 1,
    fontSize: 13,
    color: colors.dark,
    lineHeight: 18,
  },

  // Botón confirmar
  confirmarBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.green,
    borderRadius: 14,
    paddingVertical: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  confirmarText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});
