import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import colors from "../theme/colors";
import type { NavProps } from "../navigation/types";
import Footer from "../components/FooterGestor";
import { CanchasAPI } from "../api/canchas";
import { HorariosAPI } from "../api/horarios";

type Cancha = {
  id: string;
  nombre: string;
  tipoCancha: string;
  tipoCampo: string;
};

export default function GestionDisponibilidadScreen({ navigation }: NavProps<"GestionDisponibilidad">) {
  const [loading, setLoading] = useState(false);
  const [canchas, setCanchas] = useState<Cancha[]>([]);
  const [canchaSeleccionada, setCanchaSeleccionada] = useState<Cancha | null>(null);

  // Fechas
  const [fechaDesde, setFechaDesde] = useState(() => {
    const hoy = new Date();
    return hoy.toISOString().split("T")[0];
  });

  const [fechaHasta, setFechaHasta] = useState(() => {
    const hoy = new Date();
    hoy.setDate(hoy.getDate() + 7); // +7 días por defecto
    return hoy.toISOString().split("T")[0];
  });

  const [disponible, setDisponible] = useState(true);

  useEffect(() => {
    cargarMisCanchas();
  }, []);

  const cargarMisCanchas = async () => {
    setLoading(true);
    try {
      const data = await CanchasAPI.listar();
      setCanchas(data);
    } catch (error: any) {
      console.error("Error al cargar canchas:", error);
      Alert.alert("Error", "No se pudieron cargar las canchas.");
    } finally {
      setLoading(false);
    }
  };

  const aplicarCambios = async () => {
    if (!canchaSeleccionada) {
      Alert.alert("Validación", "Selecciona una cancha primero.");
      return;
    }

    if (new Date(fechaDesde) > new Date(fechaHasta)) {
      Alert.alert("Validación", "La fecha desde debe ser menor o igual a la fecha hasta.");
      return;
    }

    setLoading(true);
    try {
      const result = await HorariosAPI.cambiarDisponibilidad({
        cancha_id: canchaSeleccionada.id,
        fecha_desde: fechaDesde,
        fecha_hasta: fechaHasta,
        disponible,
      });

      Alert.alert(
        "Éxito",
        result.message || `Se actualizaron ${result.count} horarios correctamente.`,
        [{ text: "OK" }]
      );
    } catch (error: any) {
      console.error("Error al cambiar disponibilidad:", error);
      Alert.alert(
        "Error",
        error.response?.data?.message || "No se pudo cambiar la disponibilidad."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <Footer />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.headerChip}>
          <Text style={styles.headerChipText}>GESTIÓN DE DISPONIBILIDAD</Text>
        </View>

        <Text style={styles.subtitle}>
          Activa o desactiva horarios de tus canchas para mantenimiento o eventos especiales.
        </Text>

        {/* Selector de Cancha */}
        <View style={styles.section}>
          <Text style={styles.label}>Selecciona una cancha</Text>
          {loading && canchas.length === 0 ? (
            <ActivityIndicator size="small" color={colors.green} />
          ) : (
            <View style={{ gap: 8 }}>
              {canchas.map((cancha) => {
                const selected = canchaSeleccionada?.id === cancha.id;
                return (
                  <TouchableOpacity
                    key={cancha.id}
                    style={[styles.canchaCard, selected && styles.canchaCardSelected]}
                    onPress={() => setCanchaSeleccionada(cancha)}
                    activeOpacity={0.7}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.canchaName}>{cancha.nombre}</Text>
                      <Text style={styles.canchaInfo}>
                        {cancha.tipoCancha} • {cancha.tipoCampo}
                      </Text>
                    </View>
                    {selected && <Ionicons name="checkmark-circle" size={24} color={colors.green} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Rango de Fechas */}
        <View style={styles.section}>
          <Text style={styles.label}>Rango de fechas</Text>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.smallLabel}>Desde</Text>
              <Text style={styles.dateText}>{fechaDesde}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.smallLabel}>Hasta</Text>
              <Text style={styles.dateText}>{fechaHasta}</Text>
            </View>
          </View>
        </View>

        {/* Acción */}
        <View style={styles.section}>
          <Text style={styles.label}>Acción a realizar</Text>
          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.actionBtn, disponible && styles.actionBtnActive]}
              onPress={() => setDisponible(true)}
              activeOpacity={0.7}
            >
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={disponible ? "#fff" : colors.dark}
              />
              <Text style={[styles.actionBtnText, disponible && styles.actionBtnTextActive]}>
                Activar
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, !disponible && styles.actionBtnActive]}
              onPress={() => setDisponible(false)}
              activeOpacity={0.7}
            >
              <Ionicons
                name="close-circle"
                size={20}
                color={!disponible ? "#fff" : colors.dark}
              />
              <Text style={[styles.actionBtnText, !disponible && styles.actionBtnTextActive]}>
                Desactivar
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Info */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={18} color={colors.dark} />
          <Text style={styles.infoText}>
            Solo se modificarán horarios futuros que no tengan reservas confirmadas.
          </Text>
        </View>

        {/* Botón Aplicar */}
        <TouchableOpacity
          style={[styles.submitBtn, loading && { opacity: 0.6 }]}
          onPress={aplicarCambios}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitText}>Aplicar Cambios</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.yellow },
  content: { padding: 20, gap: 16 },

  headerChip: {
    alignSelf: "center",
    backgroundColor: colors.purple ?? "#B673C8",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 16,
    marginBottom: 8,
  },
  headerChipText: { color: "#fff", fontWeight: "800", letterSpacing: 0.3 },

  subtitle: {
    fontSize: 13,
    color: colors.dark,
    opacity: 0.7,
    textAlign: "center",
    marginBottom: 8,
  },

  section: { gap: 10 },

  label: {
    color: "#1B1B1B",
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 2,
  },

  smallLabel: {
    fontSize: 12,
    color: colors.dark,
    opacity: 0.7,
    marginBottom: 4,
  },

  canchaCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E6F1E9",
  },
  canchaCardSelected: {
    borderColor: colors.green,
    backgroundColor: "#F0FFF4",
  },
  canchaName: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.dark,
    marginBottom: 2,
  },
  canchaInfo: {
    fontSize: 12,
    color: colors.dark,
    opacity: 0.6,
  },

  row: {
    flexDirection: "row",
    gap: 12,
  },

  dateText: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#E6F1E9",
    fontSize: 14,
    fontWeight: "600",
    color: colors.dark,
  },

  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#E6F1E9",
  },
  actionBtnActive: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.dark,
  },
  actionBtnTextActive: {
    color: "#fff",
  },

  infoBox: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
    backgroundColor: "#FFF8E1",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#FFE082",
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: colors.dark,
    opacity: 0.8,
    lineHeight: 16,
  },

  submitBtn: {
    marginTop: 8,
    height: 48,
    borderRadius: 999,
    backgroundColor: colors.green,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
  },
  submitText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },
});
