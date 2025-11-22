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
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import colors from "../theme/colors";
import Footer from "../components/FooterGestor";
import type { NavProps } from "../navigation/types";
import { PagosAPI } from "../api/pagos";
import { formatearFechaLegible, formatearHoraLegible } from "../utils/fecha";

type EstadoPago = "pendiente" | "confirmado" | "rechazado";

interface Pago {
  id: string;
  monto_total: number;
  estado: EstadoPago;
  comprobante?: string; // Imagen del comprobante en base64
  created_at: string;
  reserva: {
    id: string;
    estado: string;
    usuario: {
      nombre: string;
      correo: string;
      telefono?: string;
    };
    items: Array<{
      horario: {
        fecha: string;
        hora_inicio: string;
        hora_fin: string;
        cancha: {
          nombre: string;
          complejo?: {
            nombre: string;
          };
        };
      };
      precio: number;
    }>;
  };
}

export default function SolicitudesReservasScreen({
  navigation,
}: NavProps<"SolicitudesReservas">) {
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filtro, setFiltro] = useState<"todos" | "pendientes" | "confirmados">("pendientes");
  const [expandedPagos, setExpandedPagos] = useState<Set<string>>(new Set());

  const cargarPagos = async () => {
    try {
      const estadoQuery = filtro === "todos" ? undefined : filtro === "pendientes" ? "pendiente" : "confirmado";
      const response = await PagosAPI.listar(estadoQuery ? { estado: estadoQuery } : {});
      // El backend devuelve { data: [...] }
      setPagos(response.data || response || []);
    } catch (error) {
      console.error("Error al cargar pagos:", error);
      Alert.alert("Error", "No se pudieron cargar los pagos.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    cargarPagos();
  }, [filtro]);

  const onRefresh = () => {
    setRefreshing(true);
    cargarPagos();
  };

  const confirmarPago = (pagoId: string, clienteNombre: string) => {
    Alert.alert(
      "Confirmar Pago",
      `¿Confirmar el pago de ${clienteNombre}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          onPress: async () => {
            try {
              await PagosAPI.confirmar(pagoId);
              Alert.alert("Éxito", "El pago ha sido confirmado.");
              cargarPagos();
            } catch (error: any) {
              console.error("Error al confirmar pago:", error);
              Alert.alert(
                "Error",
                error.response?.data?.message || "No se pudo confirmar el pago."
              );
            }
          },
        },
      ]
    );
  };

  const rechazarPago = (pagoId: string, clienteNombre: string) => {
    Alert.alert(
      "Rechazar Pago",
      `¿Rechazar el pago de ${clienteNombre}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Rechazar",
          style: "destructive",
          onPress: async () => {
            try {
              await PagosAPI.rechazar(pagoId);
              Alert.alert("Rechazado", "El pago ha sido rechazado.");
              cargarPagos();
            } catch (error: any) {
              console.error("Error al rechazar pago:", error);
              Alert.alert(
                "Error",
                error.response?.data?.message || "No se pudo rechazar el pago."
              );
            }
          },
        },
      ]
    );
  };

  const getEstadoBadge = (estado: EstadoPago) => {
    switch (estado) {
      case "pendiente":
        return { color: "#FFA500", label: "Pendiente", icon: "time-outline" };
      case "confirmado":
        return { color: colors.green, label: "Confirmado", icon: "checkmark-circle" };
      case "rechazado":
        return { color: "#B00020", label: "Rechazado", icon: "close-circle" };
      default:
        return { color: "#999", label: estado, icon: "help-circle-outline" };
    }
  };

  const formatHorarioLabel = (item: Pago["reserva"]["items"][number]) => {
    const horario = item.horario;
    if (!horario) return "Horario no disponible";
    const fecha = formatearFechaLegible(horario.fecha);
    const inicio = formatearHoraLegible(horario.hora_inicio);
    const fin = formatearHoraLegible(horario.hora_fin);
    const price = typeof item.precio === "number" ? `${item.precio.toLocaleString("es-BO")} Bs` : null;
    return `${fecha} | ${inicio} - ${fin}${price ? ` | ${price}` : ""}`;
  };

  if (loading) {
    return (
      <View style={styles.screen}>
        <StatusBar barStyle="light-content" backgroundColor={colors.green} />
        <Footer />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.green} />
          <Text style={styles.loadingText}>Cargando pagos...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={colors.green} />
      <Footer />

      <View style={styles.header}>
        <Text style={styles.title}>Gestión de Pagos</Text>
        <Text style={styles.subtitle}>Confirma o rechaza pagos de reservas</Text>

        {/* Filtros */}
        <View style={styles.filtersRow}>
          <TouchableOpacity
            style={[styles.filterChip, filtro === "pendientes" && styles.filterChipActive]}
            onPress={() => setFiltro("pendientes")}
            activeOpacity={0.7}
          >
            <Text
              style={[styles.filterChipText, filtro === "pendientes" && styles.filterChipTextActive]}
            >
              Pendientes
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, filtro === "confirmados" && styles.filterChipActive]}
            onPress={() => setFiltro("confirmados")}
            activeOpacity={0.7}
          >
            <Text
              style={[styles.filterChipText, filtro === "confirmados" && styles.filterChipTextActive]}
            >
              Confirmados
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, filtro === "todos" && styles.filterChipActive]}
            onPress={() => setFiltro("todos")}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterChipText, filtro === "todos" && styles.filterChipTextActive]}>
              Todos
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.green]} />
        }
      >
        {pagos.length > 0 ? (
          pagos.map((pago) => {
            const badge = getEstadoBadge(pago.estado);
            const primeraCancha = pago.reserva.items[0]?.horario.cancha;
            // Calcular total si no viene desde backend
            const totalCalculado =
              typeof pago.monto_total === 'number' && !Number.isNaN(pago.monto_total)
                ? pago.monto_total
                : pago.reserva.items.reduce((sum, it) => sum + (it.precio || 0), 0);

            return (
              <View key={pago.id} style={styles.card}>
                {/* Header */}
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{pago.reserva.usuario.nombre}</Text>
                    <Text style={styles.cardSubtitle}>{pago.reserva.usuario.correo}</Text>
                    {pago.reserva.usuario.telefono && (
                      <Text style={styles.cardSubtitle}>{pago.reserva.usuario.telefono}</Text>
                    )}
                  </View>
                  <View style={[styles.badge, { backgroundColor: badge.color }]}>
                    <Ionicons name={badge.icon as any} size={14} color="#fff" />
                    <Text style={styles.badgeText}>{badge.label}</Text>
                  </View>
                </View>

                {/* Cancha */}
                <View style={styles.canchaSection}>
                  <Ionicons name="football-outline" size={16} color={colors.green} />
                  <Text style={styles.canchaText}>
                    {primeraCancha?.complejo?.nombre || primeraCancha?.nombre}
                  </Text>
                </View>

                {/* Horarios */}
                <View style={styles.horariosSection}>
                  <Text style={styles.sectionTitle}>Horarios reservados:</Text>
                  {(expandedPagos.has(pago.id) ? pago.reserva.items : pago.reserva.items.slice(0, 3)).map((item, idx) => (
                    <View key={`${pago.id}-${idx}`} style={styles.horarioItem}>
                      <Ionicons name="time-outline" size={14} color={colors.dark} />
                      <Text style={styles.horarioText}>{formatHorarioLabel(item)}</Text>
                    </View>
                  ))}
                  {pago.reserva.items.length > 3 && !expandedPagos.has(pago.id) && (
                    <TouchableOpacity onPress={() => setExpandedPagos((prev) => new Set(prev).add(pago.id))}>
                      <Text style={styles.moreText}>
                        +{pago.reserva.items.length - 3} horarios más (ver todos)
                      </Text>
                    </TouchableOpacity>
                  )}
                  {pago.reserva.items.length > 3 && expandedPagos.has(pago.id) && (
                    <TouchableOpacity
                      onPress={() => {
                        const next = new Set(expandedPagos);
                        next.delete(pago.id);
                        setExpandedPagos(next);
                      }}
                    >
                      <Text style={styles.moreText}>Mostrar menos</Text>
                    </TouchableOpacity>
                  )}
                </View>
                {/* Total */}
                <View style={styles.totalSection}>
                  <Text style={styles.totalLabel}>Monto Total:</Text>
                  <Text style={styles.totalAmount}>{totalCalculado} Bs</Text>
                </View>

                {/* Comprobante */}
                {pago.comprobante ? (
                  <View style={styles.comprobanteSection}>
                    <Text style={styles.sectionTitle}>Comprobante de Pago:</Text>
                    <Image
                      source={{ uri: pago.comprobante }}
                      style={styles.comprobanteImage}
                      resizeMode="contain"
                    />
                  </View>
                ) : (
                  <View style={styles.sinComprobanteSection}>
                    <Ionicons name="document-outline" size={20} color="#999" />
                    <Text style={styles.sinComprobanteText}>
                      Sin comprobante - El cliente aún no ha subido el comprobante
                    </Text>
                  </View>
                )}

                {/* Acciones (solo si está pendiente) */}
                {pago.estado === "pendiente" && (
                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.confirmarBtn]}
                      onPress={() => confirmarPago(pago.id, pago.reserva.usuario.nombre)}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                      <Text style={styles.actionBtnText}>Confirmar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionBtn, styles.rechazarBtn]}
                      onPress={() => rechazarPago(pago.id, pago.reserva.usuario.nombre)}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="close-circle-outline" size={18} color="#B00020" />
                      <Text style={[styles.actionBtnText, { color: "#B00020" }]}>Rechazar</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Fecha del pago */}
                <Text style={styles.fechaText}>
                  Registrado: {formatearFechaLegible(pago.created_at)} · {formatearHoraLegible(pago.created_at)}
                </Text>
              </View>
            );
          })
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="cash-outline" size={64} color="#CCC" />
            <Text style={styles.emptyText}>No hay pagos {filtro !== "todos" ? filtro : ""}</Text>
            <Text style={styles.emptySubtext}>
              {filtro === "pendientes"
                ? "Cuando los clientes marquen sus pagos, aparecerán aquí"
                : "Cambia el filtro para ver otros pagos"}
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

  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    backgroundColor: "#fff",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },

  title: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.dark,
  },
  subtitle: {
    fontSize: 13,
    color: colors.dark,
    opacity: 0.7,
    marginTop: 4,
    marginBottom: 12,
  },

  filtersRow: {
    flexDirection: "row",
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#E6F1E9",
  },
  filterChipActive: {
    backgroundColor: colors.green,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.dark,
  },
  filterChipTextActive: {
    color: "#fff",
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 12,
  },

  // Card
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.dark,
  },
  cardSubtitle: {
    fontSize: 12,
    color: colors.dark,
    opacity: 0.6,
    marginTop: 2,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
  },

  canchaSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: "#F0FAF4",
    borderRadius: 8,
    marginBottom: 10,
  },
  canchaText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.dark,
  },

  // Horarios
  horariosSection: {
    marginBottom: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#E6F1E9",
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.dark,
    opacity: 0.7,
    marginBottom: 6,
  },
  horarioItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 3,
  },
  horarioText: {
    fontSize: 12,
    color: colors.dark,
  },
  moreText: {
    fontSize: 11,
    color: colors.green,
    fontWeight: "700",
    marginTop: 4,
  },

  // Total
  totalSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#E6F1E9",
    marginBottom: 10,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.dark,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.green,
  },

  // Acciones
  actions: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    elevation: 2,
  },
  confirmarBtn: {
    backgroundColor: colors.green,
  },
  rechazarBtn: {
    backgroundColor: "#FFEAEA",
    elevation: 0,
  },
  actionBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
  },

  fechaText: {
    fontSize: 10,
    color: colors.dark,
    opacity: 0.5,
    textAlign: "right",
  },

  // Comprobante
  comprobanteSection: {
    marginTop: 12,
    marginBottom: 12,
  },
  comprobanteImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
    marginTop: 8,
  },
  sinComprobanteSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    marginTop: 12,
    marginBottom: 12,
  },
  sinComprobanteText: {
    flex: 1,
    fontSize: 12,
    color: "#999",
    fontStyle: "italic",
  },

  // Empty state
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 10,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.dark,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.dark,
    opacity: 0.6,
    textAlign: "center",
    marginTop: 4,
  },
});





