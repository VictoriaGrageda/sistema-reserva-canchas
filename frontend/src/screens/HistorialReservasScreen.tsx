import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import colors from "../theme/colors";
import Footer from "../components/Footer";
import { ReservasAPI } from "../api/reservas";
import type { NavProps } from "../navigation/types";
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

type BadgeInfo = {
  color: string;
  label: string;
  icon: string;
};

export default function HistorialReservasScreen({ navigation }: NavProps<"HistorialReservas">) {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const cargarReservas = async () => {
    try {
      const response = await ReservasAPI.listarMisReservas();
      const reservasData = response.data || response || [];
      setReservas(reservasData);
    } catch (error) {
      console.error("Error al cargar historial:", error);
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

  const getEstadoBadge = (estado: string): BadgeInfo => {
    switch (estado) {
      case "pendiente":
        return { color: "#FFA500", label: "Pendiente", icon: "time-outline" };
      case "confirmada":
        return { color: colors.green, label: "Confirmada", icon: "checkmark-circle" };
      case "cancelada":
        return { color: "#B00020", label: "Cancelada", icon: "close-circle" };
      default:
        return { color: "#999", label: estado, icon: "help-circle-outline" };
    }
  };

  const calcularTotal = (items: Item[]) => {
    return items.reduce((sum, item) => sum + item.precio, 0);
  };

  if (loading) {
    return (
      <View style={styles.screen}>
        <StatusBar barStyle="light-content" backgroundColor={colors.green} />
        <Footer />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.green} />
          <Text style={styles.loadingText}>Cargando historial...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={colors.green} />
      <Footer />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.green]} />
        }
      >
        <Text style={styles.title}>Historial de Reservas</Text>
        <Text style={styles.subtitle}>Todas tus reservas realizadas</Text>

        {reservas.length > 0 ? (
          reservas.map((reserva) => {
            const badge = getEstadoBadge(reserva.estado);
            const total = calcularTotal(reserva.items);
            const primeraCancha = reserva.items[0]?.horario.cancha;

            return (
              <View key={reserva.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>
                      {primeraCancha?.complejo?.nombre || primeraCancha?.nombre}
                    </Text>
                    <Text style={styles.cardSubtitle}>
                      {formatearFechaLegible(reserva.created_at)} Â· {formatearHoraLegible(reserva.created_at)}
                    </Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: badge.color }]}> 
                    <Ionicons name={badge.icon as any} size={14} color="#fff" />
                    <Text style={styles.badgeText}>{badge.label}</Text>
                  </View>
                </View>

                <View style={styles.horariosSection}>
                  <Text style={styles.sectionTitle}>Horarios reservados:</Text>
                  {(expandedIds.has(reserva.id) ? reserva.items : reserva.items.slice(0, 3)).map((item, idx) => (
                    <View key={`${reserva.id}-${idx}`} style={styles.horarioRow}>
                      <Ionicons name="time-outline" size={14} color={colors.dark} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.horarioText}>
                          {formatearFechaLegible(item.horario.fecha)} - {formatearHoraLegible(item.horario.hora_inicio)} - {formatearHoraLegible(item.horario.hora_fin)}
                        </Text>
                      </View>
                      <Text style={styles.precioItem}>{item.precio} Bs</Text>
                    </View>
                  ))}
                  {reserva.items.length > 3 && !expandedIds.has(reserva.id) && (
                    <TouchableOpacity onPress={() => setExpandedIds((prev) => new Set(prev).add(reserva.id))}>
                      <Text style={styles.moreText}>
                        +{reserva.items.length - 3} horarios mas (ver todos)
                      </Text>
                    </TouchableOpacity>
                  )}
                  {reserva.items.length > 3 && expandedIds.has(reserva.id) && (
                    <TouchableOpacity
                      onPress={() => {
                        const next = new Set(expandedIds);
                        next.delete(reserva.id);
                        setExpandedIds(next);
                      }}
                    >
                      <Text style={styles.moreText}>Mostrar solo primeros 3</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.totalSection}>
                  <Text style={styles.totalLabel}>Total pagado:</Text>
                  <Text style={styles.totalAmount}>{total} Bs</Text>
                </View>
              </View>
            );
          })
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color="#CCC" />
            <Text style={styles.placeholder}>No tienes reservas en el historial</Text>
            <Text style={styles.emptySubtext}>
              Tus reservas confirmadas y canceladas aparecerÃ¡n aquÃ­
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.lightGreen,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  loadingText: {
    fontSize: 14,
    color: colors.dark,
    opacity: 0.7,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.dark,
  },
  subtitle: {
    fontSize: 14,
    color: colors.dark,
    opacity: 0.7,
    marginBottom: 12,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.dark,
  },
  cardSubtitle: {
    fontSize: 13,
    color: colors.dark,
    opacity: 0.7,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
  },
  horariosSection: {
    borderTopWidth: 1,
    borderTopColor: "#E6F1E9",
    paddingTop: 10,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.dark,
    marginBottom: 8,
  },
  horarioRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  horarioText: {
    fontSize: 14,
    color: colors.dark,
    fontWeight: "600",
  },
  precioItem: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.green,
  },
  moreText: {
    fontSize: 12,
    color: colors.dark,
    opacity: 0.6,
    marginTop: 6,
  },
  totalSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  totalLabel: {
    fontSize: 13,
    color: colors.dark,
    opacity: 0.7,
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.green,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 10,
  },
  placeholder: {
    fontSize: 18,
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

