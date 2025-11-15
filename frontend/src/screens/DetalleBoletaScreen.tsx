import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import colors from "../theme/colors";
import Footer from "../components/Footer";
import type { NavProps } from "../navigation/types";
import { PagosAPI } from "../api/pagos";
import { formatearFechaLegible, formatearHoraLegible } from "../utils/fecha";

type HorarioDetalle = {
  hora_inicio: string;
  hora_fin: string;
  fecha: string;
  cancha: {
    nombre: string;
    complejo?: { nombre: string };
    tipoCancha?: string | null;
    tipoCampo?: string | null;
    otb?: string | null;
    subalcaldia?: string | null;
  };
};

type ItemsReservaDetalle = {
  horario: HorarioDetalle;
  precio: number | string | null;
};

type ReservaDetalle = {
  id: string;
  estado: string;
  created_at: string;
  updated_at?: string | null;
  items: ItemsReservaDetalle[];
};

type QRDetalle = {
  id: string;
  imagen_qr?: string;
};

type PagoDetalle = {
  id: string;
  estado: string;
  fecha_pago?: string | null;
  updated_at?: string | null;
  comprobante?: string | null;
  qr?: QRDetalle | null;
  reserva: ReservaDetalle;
};

export default function DetalleBoletaScreen({
  navigation,
  route,
}: NavProps<"DetalleBoleta">) {
  const { reserva_id } = route.params;
  const [pago, setPago] = useState<PagoDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalizeImageUri = (val?: string) => {
    if (!val) return undefined as unknown as string;
    if (val.startsWith("data:image/")) return val;
    if (val.startsWith("http://")) return val.replace("http://", "https://");
    try {
      if (/^[A-Za-z0-9+/=]+$/.test(val.slice(0, 40))) {
        return `data:image/png;base64,${val}`;
      }
    } catch {}
    return val;
  };

  const formatCurrency = (value: number) => {
    return `${value.toLocaleString("es-ES", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} Bs`;
  };

  const getTipoLabel = (tipo?: string | null) => {
    if (!tipo) return "";
    const labels: Record<string, string> = {
      FUT5: "Fútbol 5",
      FUT6: "Fútbol 6",
      FUT8: "Fútbol 8",
      FUT11: "Fútbol 11",
      SINTETICO: "Césped sintético",
      TIERRA: "Tierra batida",
      CESPED: "Césped natural",
    };
    return labels[tipo] || tipo;
  };

  const obtenerFechaPagoTexto = () => {
    if (!pago || pago.estado === "pendiente") return "Pendiente";
    const referencia =
      pago.fecha_pago || pago.updated_at || pago.reserva.updated_at || pago.reserva.created_at;
    if (!referencia) return "Pendiente";
    return `${formatearFechaLegible(referencia)} · ${formatearHoraLegible(referencia)}`;
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "confirmado":
        return { color: colors.green, label: "Confirmado" };
      case "pendiente":
        return { color: "#FFA500", label: "Pendiente" };
      case "rechazado":
        return { color: colors.red, label: "Rechazado" };
      default:
        return { color: colors.gray, label: estado };
    }
  };

  const cargarPago = async () => {
    try {
      if (!refreshing) setLoading(true);
      const response = await PagosAPI.obtenerPorReserva(reserva_id);
      const pagoData = response.data || response;
      if (!pagoData) {
        setError("No se encontró la boleta asociada a esta reserva.");
        setPago(null);
      } else {
        setPago(pagoData);
        setError(null);
      }
    } catch (err: any) {
      const mensaje = err?.response?.data?.message || "No se pudo cargar la boleta.";
      setError(mensaje);
      Alert.alert("Error", mensaje);
      setPago(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    cargarPago();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    cargarPago();
  };

  if (loading) {
    return (
      <View style={styles.screen}>
        <StatusBar barStyle="light-content" backgroundColor={colors.green} />
        <Footer />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.green} />
          <Text style={styles.loadingText}>Cargando boleta...</Text>
        </View>
      </View>
    );
  }

  const badge = pago ? getEstadoBadge(pago.estado) : { color: colors.gray, label: "Sin boleta" };
  const total = pago ? pago.reserva.items.reduce((sum, item) => sum + Number(item.precio || 0), 0) : 0;
  const cancha = pago?.reserva.items[0]?.horario.cancha;

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
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={colors.dark} />
          <Text style={styles.backBtnText}>Volver</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Detalle de la boleta</Text>

        {error ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="alert-circle-outline" size={64} color="#CCC" />
            <Text style={styles.emptyText}>{error}</Text>
          </View>
        ) : !pago ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color="#CCC" />
            <Text style={styles.emptyText}>No se encontró la boleta</Text>
            <Text style={styles.emptySubtext}>Intenta refrescar para volver a cargar</Text>
          </View>
        ) : (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>
                    Boleta #{pago.reserva.id.slice(0, 8).toUpperCase()}
                  </Text>
                <Text style={styles.cardSubtitle}>{cancha?.complejo?.nombre || cancha?.nombre}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: badge.color }]}>
                <Text style={styles.badgeText}>{badge.label}</Text>
              </View>
            </View>

            <View style={styles.canchaDetails}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Tipo de cancha</Text>
                <Text style={styles.infoValue}>
                  {[getTipoLabel(cancha?.tipoCancha), getTipoLabel(cancha?.tipoCampo)]
                    .filter(Boolean)
                    .join(" • ")}
                </Text>
              </View>
              {cancha?.otb && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>OTB</Text>
                  <Text style={styles.infoValue}>{cancha.otb}</Text>
                </View>
              )}
              {cancha?.subalcaldia && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Subalcaldía</Text>
                  <Text style={styles.infoValue}>{cancha.subalcaldia}</Text>
                </View>
              )}
            </View>

            <View style={styles.infoSection}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Emitida</Text>
                <Text style={styles.infoValue}>
                  {formatearFechaLegible(pago.reserva.created_at)} · {formatearHoraLegible(pago.reserva.created_at)}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Total</Text>
                <Text style={styles.infoValue}>{formatCurrency(total)}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Fecha de pago</Text>
                <Text style={styles.infoValue}>{obtenerFechaPagoTexto()}</Text>
              </View>
            </View>

            <View style={styles.horariosSection}>
              <Text style={styles.sectionTitle}>Horarios incluidos</Text>
              {pago.reserva.items.map((item, idx) => (
                <View key={idx} style={styles.horarioRow}>
                  <Ionicons name="time-outline" size={16} color={colors.green} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.horarioText}>
                      {formatearFechaLegible(item.horario.fecha)} · {formatearHoraLegible(item.horario.hora_inicio)} - {formatearHoraLegible(item.horario.hora_fin)}
                    </Text>
                    <Text style={styles.horarioMeta}>{item.horario.cancha.nombre}</Text>
                  </View>
                  <Text style={styles.itemPrice}>{formatCurrency(Number(item.precio || 0))}</Text>
                </View>
              ))}
            </View>

            {pago.comprobante && (
              <View style={styles.mediaSection}>
                <Text style={styles.sectionTitle}>Comprobante</Text>
                <Image source={{ uri: normalizeImageUri(pago.comprobante) }} style={styles.mediaImage} resizeMode="contain" />
              </View>
            )}

            {pago.qr?.imagen_qr && (
              <View style={styles.mediaSection}>
                <Text style={styles.sectionTitle}>Código QR asociado</Text>
                <Image source={{ uri: normalizeImageUri(pago.qr.imagen_qr) }} style={styles.mediaImage} resizeMode="contain" />
              </View>
            )}
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
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    gap: 16,
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
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.dark,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.dark,
    marginBottom: 6,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
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
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
  },
  infoSection: {
    borderTopWidth: 1,
    borderTopColor: "#E6F1E9",
    borderBottomWidth: 1,
    borderBottomColor: "#E6F1E9",
    paddingVertical: 12,
    marginBottom: 12,
  },
  canchaDetails: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#E6F1E9",
    borderBottomWidth: 1,
    borderBottomColor: "#E6F1E9",
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 12,
    color: colors.dark,
    opacity: 0.7,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.dark,
  },
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
    marginBottom: 10,
  },
  horarioRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  horarioText: {
    fontSize: 14,
    color: colors.dark,
    fontWeight: "600",
  },
  horarioMeta: {
    fontSize: 12,
    color: colors.gray,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.green,
  },
  mediaSection: {
    marginTop: 12,
    alignItems: "center",
    gap: 8,
  },
  mediaImage: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 10,
    backgroundColor: colors.mint,
  },
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
    opacity: 0.7,
    textAlign: "center",
  },
});
