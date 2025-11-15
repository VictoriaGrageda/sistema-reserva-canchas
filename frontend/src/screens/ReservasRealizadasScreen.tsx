import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import colors from "../theme/colors";
import Footer from "../components/Footer";
import type { NavProps } from "../navigation/types";
import { ReservasAPI } from "../api/reservas";
import { formatearFechaLegible, formatearHoraLegible } from "../utils/fecha";

interface Item {
  horario: {
    hora_inicio: string;
    hora_fin: string;
    fecha: string;
    cancha: {
      nombre: string;
      complejo?: {
        nombre: string;
      };
    };
  };
  precio: number;
}

interface Reserva {
  id: string;
  estado: string;
  created_at: string;
  items: Item[];
}

const hourToMinutes = (value?: string): number => {
  if (!value) return Infinity;
  if (value.includes("T")) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.getHours() * 60 + date.getMinutes();
    }
  }
  const [hour = "0", minute = "0"] = value.split(":");
  const h = Number(hour);
  const m = Number(minute);
  if (Number.isNaN(h) || Number.isNaN(m)) return Infinity;
  return h * 60 + m;
};

export default function ReservasRealizadasScreen({ navigation }: NavProps<"ReservasRealizadas">) {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const cargarReservas = async () => {
    try {
      const response = await ReservasAPI.listarMisReservas();
      const reservasData = response.data || response || [];
      const activas = reservasData.filter(
        (r: Reserva) => r.estado === "pendiente" || r.estado === "confirmada"
      );
      setReservas(activas);
    } catch (error) {
      console.error("Error al cargar reservas:", error);
      Alert.alert("Error", "No se pudieron cargar las reservas.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    cargarReservas();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    cargarReservas();
  };

  const verDetalleBoleta = (reservaId: string) => {
    navigation.navigate("DetalleBoleta", { reserva_id: reservaId });
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "pendiente":
        return { color: "#FFA500", label: "Pendiente" };
      case "confirmada":
        return { color: colors.green, label: "Confirmada" };
      default:
        return { color: "#999", label: estado };
    }
  };

  if (loading) {
    return (
      <View style={styles.screen}>
        <StatusBar barStyle="light-content" backgroundColor={colors.green} />
        <Footer />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.green} />
          <Text style={styles.loadingText}>Cargando reservas...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={colors.green} />
      <Footer />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.green]} />
        }
      >
        <View style={styles.body}>
          <Text style={styles.title}>Mis Reservas Activas</Text>

          <View style={styles.card}>
            <View style={styles.tableRowHeader}>
              <Text style={[styles.tableHeaderText, styles.colId]}>Num de reserva</Text>
              <Text style={[styles.tableHeaderText, styles.colFecha]}>Fecha / Hora</Text>
              <Text style={[styles.tableHeaderText, styles.colEstado]}>Estado</Text>
              <Text style={[styles.tableHeaderText, styles.colAccion]} />
            </View>

            {reservas.length > 0 ? (
              reservas.map((reserva) => {
                const estado = getEstadoBadge(reserva.estado);
                const primerHorario = reserva.items[0]?.horario;
                const fechaTexto = formatearFechaLegible(primerHorario?.fecha || reserva.created_at);
                let horaTexto = formatearHoraLegible(reserva.created_at);
                if (reserva.items.length > 0) {
                  let minStart = Infinity;
                  let maxEnd = -Infinity;
                  let startValue: string | undefined;
                  let endValue: string | undefined;
                  reserva.items.forEach(({ horario }) => {
                    const inicio = hourToMinutes(horario.hora_inicio);
                    if (inicio < minStart) {
                      minStart = inicio;
                      startValue = horario.hora_inicio;
                    }
                    const fin = hourToMinutes(horario.hora_fin);
                    if (fin > maxEnd) {
                      maxEnd = fin;
                      endValue = horario.hora_fin;
                    }
                  });
                  if (startValue && endValue) {
                    horaTexto = `${formatearHoraLegible(startValue)} - ${formatearHoraLegible(endValue)}`;
                  }
                }

                return (
                  <View key={reserva.id} style={styles.tableRow}>
                    <View style={[styles.tableCell, styles.colId]}>
                      <Text style={styles.cellText}>{reserva.id.slice(0, 8).toUpperCase()}</Text>
                    </View>
                    <View style={[styles.tableCell, styles.colFecha]}>
                      <Text style={styles.cellText}>{fechaTexto}</Text>
                      <Text style={styles.cellSubtext}>{horaTexto}</Text>
                    </View>
                    <View style={[styles.tableCell, styles.colEstado]}>
                      <View style={[styles.badge, { backgroundColor: estado.color }]}>
                        <Text style={styles.badgeText}>{estado.label}</Text>
                      </View>
                    </View>
                    <View style={[styles.tableCell, styles.colAccion]}>
                      <TouchableOpacity
                        style={styles.boletaButton}
                        onPress={() => verDetalleBoleta(reserva.id)}
                        activeOpacity={0.85}
                      >
                        <Text style={styles.boletaButtonText}>Ver boleta</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="calendar-outline" size={64} color="#CCC" />
                <Text style={styles.emptyText}>No tienes reservas activas</Text>
                <Text style={styles.emptySubtext}>
                  Ve a "Reservar Canchas" para hacer una nueva reserva
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.lightGreen,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  body: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.dark,
    marginBottom: 20,
  },
  card: {
    borderRadius: 28,
    backgroundColor: colors.white,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E3E8EC",
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  tableRowHeader: {
    flexDirection: "row",
    backgroundColor: "#F5F5F5",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#ECECEC",
  },
  tableCell: {
    flex: 1,
    justifyContent: "center",
  },
  colId: {
    flex: 2,
  },
  colFecha: {
    flex: 2,
  },
  colEstado: {
    flex: 2,
  },
  colAccion: {
    flex: 2,
    alignItems: "flex-end",
  },
  tableHeaderText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "700",
    color: colors.dark,
    textTransform: "uppercase",
  },
  cellText: {
    fontSize: 13,
    color: colors.dark,
  },
  cellSubtext: {
    fontSize: 11,
    color: colors.dark,
    opacity: 0.65,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  boletaButton: {
    backgroundColor: colors.green,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  boletaButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: colors.dark,
    opacity: 0.7,
  },
  emptyContainer: {
    marginTop: 20,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.dark,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.dark,
    opacity: 0.6,
    textAlign: "center",
  },
});
