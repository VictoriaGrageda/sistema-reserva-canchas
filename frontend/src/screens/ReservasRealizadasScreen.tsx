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
  Modal,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import colors from "../theme/colors";
import Footer from "../components/Footer";
import type { NavProps } from "../navigation/types";
import { ReservasAPI } from "../api/reservas";
import { PagosAPI } from "../api/pagos";
import { formatearFechaCorta } from "../utils/fecha";

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

export default function ReservasRealizadasScreen({
  navigation,
}: NavProps<"ReservasRealizadas">) {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [qrModal, setQrModal] = useState<{ visible: boolean; url: string | null }>({
    visible: false,
    url: null,
  });

  // Normaliza URIs de imagen: maneja base64 sin prefijo y fuerza https
  const normalizeQrUri = (val?: string) => {
    if (!val) return undefined as unknown as string;
    if (val.startsWith('data:image/')) return val;
    if (val.startsWith('http://')) return val.replace('http://', 'https://');
    try {
      if (/^[A-Za-z0-9+/=]+$/.test(val.slice(0, 40))) {
        return `data:image/png;base64,${val}`;
      }
    } catch {}
    return val;
  };

  const cargarReservas = async () => {
    try {
      const response = await ReservasAPI.listarMisReservas();
      // El backend devuelve { data: [...] }
      const reservasData = response.data || response || [];
      // Filtrar solo pendientes y confirmadas
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

  const cancelarReserva = (reservaId: string) => {
    Alert.alert(
      "Cancelar Reserva",
      "¿Estás seguro de que deseas cancelar esta reserva?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Sí, cancelar",
          style: "destructive",
          onPress: async () => {
            try {
              await ReservasAPI.cancelar(reservaId);
              Alert.alert("Éxito", "La reserva ha sido cancelada.");
              cargarReservas();
            } catch (error: any) {
              console.error("Error al cancelar:", error);
              Alert.alert(
                "Error",
                error.response?.data?.message || "No se pudo cancelar la reserva."
              );
            }
          },
        },
      ]
    );
  };

  const verQRPago = async (reservaId: string) => {
    try {
      const response = await PagosAPI.obtenerQR(reservaId);
      // El backend devuelve { data: { pago, qr } }
      const qrData = response.data || response;

      if (qrData && qrData.qr && qrData.qr.imagen_qr) {
        setQrModal({ visible: true, url: qrData.qr.imagen_qr });
      } else {
        Alert.alert(
          "QR no disponible",
          "No se encontró un código QR de pago para esta reserva."
        );
      }
    } catch (error) {
      console.error("Error al obtener QR:", error);
      Alert.alert("Error", "No se pudo obtener el código QR de pago.");
    }
  };

  const marcarComoPagado = (reservaId: string) => {
    // Navegar a DetalleReservaQR donde puede subir el comprobante
    navigation.navigate("DetalleReservaQR", { reserva_id: reservaId });
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
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.green]} />
        }
      >
        <Text style={styles.title}>Mis Reservas Activas</Text>

        {reservas.length > 0 ? (
          reservas.map((reserva) => {
            const badge = getEstadoBadge(reserva.estado);
            const total = calcularTotal(reserva.items);
            const primeraCancha = reserva.items[0]?.horario.cancha;

            return (
              <View key={reserva.id} style={styles.card}>
                {/* Header */}
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>
                      {primeraCancha?.complejo?.nombre || primeraCancha?.nombre}
                    </Text>
                    <Text style={styles.cardSubtitle}>
                      {new Date(reserva.created_at).toLocaleDateString("es-ES", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: badge.color }]}>
                    <Text style={styles.badgeText}>{badge.label}</Text>
                  </View>
                </View>

                {/* Horarios */}
                <View style={styles.horariosSection}>
                  <Text style={styles.sectionTitle}>Horarios reservados:</Text>
                  {reserva.items.map((item, idx) => (
                    <View key={idx} style={styles.horarioItem}>
                      <Ionicons name="time-outline" size={16} color={colors.green} />
                      <Text style={styles.horarioText}>
                        {formatearFechaCorta(item.horario.fecha)}{" "}
                        • {item.horario.hora_inicio.substring(0, 5)} - {item.horario.hora_fin.substring(0, 5)}
                      </Text>
                      <Text style={styles.precioItem}>{item.precio} Bs</Text>
                    </View>
                  ))}
                </View>

                {/* Total */}
                <View style={styles.totalSection}>
                  <Text style={styles.totalLabel}>Total:</Text>
                  <Text style={styles.totalAmount}>{total} Bs</Text>
                </View>

                {/* Acciones */}
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.qrBtn]}
                    onPress={() => verQRPago(reserva.id)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="qr-code-outline" size={18} color="#fff" />
                    <Text style={styles.actionBtnText}>Ver QR</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, styles.pagarBtn]}
                    onPress={() => marcarComoPagado(reserva.id)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                    <Text style={styles.actionBtnText}>Marcar pagado</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, styles.cancelBtn]}
                    onPress={() => cancelarReserva(reserva.id)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="close-circle-outline" size={18} color="#B00020" />
                    <Text style={[styles.actionBtnText, { color: "#B00020" }]}>Cancelar</Text>
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
      </ScrollView>

      {/* Modal QR */}
      <Modal
        visible={qrModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setQrModal({ visible: false, url: null })}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.qrModalCard}>
            <Text style={styles.qrModalTitle}>Código QR para Pago</Text>
            {qrModal.url && (
              <Image source={{ uri: normalizeQrUri(qrModal.url) }} style={styles.qrImage} resizeMode="contain" />
            )}
            <TouchableOpacity
              style={styles.closeModalBtn}
              onPress={() => setQrModal({ visible: false, url: null })}
              activeOpacity={0.85}
            >
              <Text style={styles.closeModalText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    paddingBottom: 24,
    gap: 12,
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

  title: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.dark,
    marginBottom: 10,
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
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.dark,
  },
  cardSubtitle: {
    fontSize: 13,
    color: colors.dark,
    opacity: 0.6,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
  },

  // Horarios
  horariosSection: {
    marginBottom: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#E6F1E9",
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.dark,
    opacity: 0.8,
    marginBottom: 8,
  },
  horarioItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
  },
  horarioText: {
    flex: 1,
    fontSize: 13,
    color: colors.dark,
  },
  precioItem: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.green,
  },

  // Total
  totalSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#E6F1E9",
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 15,
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
  qrBtn: {
    backgroundColor: "#5C6BC0",
  },
  pagarBtn: {
    backgroundColor: colors.green,
  },
  cancelBtn: {
    backgroundColor: "#FFEAEA",
    elevation: 0,
  },
  actionBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
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

  // Modal QR
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  qrModalCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
  },
  qrModalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.dark,
    marginBottom: 16,
  },
  qrImage: {
    width: "100%",
    aspectRatio: 1,
    marginBottom: 16,
  },
  closeModalBtn: {
    backgroundColor: colors.green,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 12,
  },
  closeModalText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },
});
