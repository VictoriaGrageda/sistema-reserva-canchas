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
  Image,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import colors from "../theme/colors";
import Footer from "../components/Footer";
import type { NavProps } from "../navigation/types";
import { ReservasAPI } from "../api/reservas";
import { PagosAPI } from "../api/pagos";

interface Horario {
  hora_inicio: string;
  hora_fin: string;
  fecha: string;
  cancha: {
    nombre: string;
    tipoCancha: string;
    tipoCampo: string;
    complejo?: {
      nombre: string;
      ciudad?: string;
    };
  };
}

interface ReservaDetalle {
  id: string;
  estado: string;
  created_at: string;
  items: Array<{
    horario: Horario;
    precio: number;
  }>;
}

interface QRData {
  id: string;
  imagen_qr: string;
  monto: number;
}

export default function DetalleReservaQRScreen({
  navigation,
  route,
}: NavProps<"DetalleReservaQR">) {
  const { reserva_id } = route.params;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reserva, setReserva] = useState<ReservaDetalle | null>(null);
  const [qrData, setQRData] = useState<QRData | null>(null);
  const [comprobanteUri, setComprobanteUri] = useState<string | null>(null);

  const cargarDatos = async () => {
    try {
      console.log("🔍 Cargando detalles de reserva:", reserva_id);

      // Cargar datos de la reserva y el QR en paralelo
      const [reservaResponse, qrResponse] = await Promise.all([
        ReservasAPI.obtenerDetalle(reserva_id),
        PagosAPI.obtenerQR(reserva_id),
      ]);

      console.log("📦 Respuesta reserva:", reservaResponse);
      console.log("📦 Respuesta QR:", qrResponse);

      // Extraer la reserva
      const reservaData = reservaResponse.data || reservaResponse;
      if (reservaData) {
        setReserva(reservaData);
        console.log("✅ Reserva cargada:", reservaData.id);
      } else {
        console.log("❌ No se encontró la reserva en la respuesta");
      }

      // Extraer datos del QR
      const qr = qrResponse.data || qrResponse;
      if (qr && qr.qr) {
        setQRData(qr.qr);
        console.log("✅ QR cargado");
      } else {
        console.log("⚠️ No se encontró QR en la respuesta");
      }
    } catch (error: any) {
      console.error("❌ Error al cargar datos:", error);
      console.error("Error completo:", error.response?.data || error.message);
      Alert.alert(
        "Error",
        error.response?.data?.message || "No se pudieron cargar los datos de la reserva."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    cargarDatos();
  };

  const subirComprobante = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permiso requerido", "Autoriza el acceso a tus fotos para subir el comprobante.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setComprobanteUri(result.assets[0].uri);
    }
  };

  const marcarComoPagado = async () => {
    console.log("🔍 Verificando comprobante:", comprobanteUri);

    if (!comprobanteUri) {
      Alert.alert(
        "Comprobante Requerido",
        "Por favor, sube una foto del comprobante de pago antes de continuar."
      );
      return;
    }

    Alert.alert(
      "Confirmar Pago",
      "¿Ya realizaste el pago por transferencia/QR?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sí, ya pagué",
          onPress: async () => {
            try {
              console.log("📤 Enviando pago con comprobante:", comprobanteUri);
              console.log("📤 QR ID:", qrData?.id);

              await PagosAPI.marcarRealizado(reserva_id, comprobanteUri, qrData?.id);

              console.log("✅ Pago marcado exitosamente");

              Alert.alert(
                "¡Pago Registrado!",
                "Tu pago ha sido registrado. El administrador lo confirmará pronto.",
                [
                  {
                    text: "Ver Mis Reservas",
                    onPress: () => navigation.replace("ReservasRealizadas"),
                  },
                ]
              );
              cargarDatos();
            } catch (error: any) {
              console.error("❌ Error al marcar pago:", error);
              console.error("Error response:", error.response?.data);
              Alert.alert(
                "Error",
                error.response?.data?.message || "No se pudo registrar el pago."
              );
            }
          },
        },
      ]
    );
  };

  const calcularTotal = () => {
    if (!reserva) return 0;
    return reserva.items.reduce((sum, item) => sum + item.precio, 0);
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

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "pendiente":
        return { color: "#FFA500", label: "Pendiente de Pago", icon: "time-outline" };
      case "confirmada":
        return { color: colors.green, label: "Confirmada", icon: "checkmark-circle" };
      case "cancelada":
        return { color: "#B00020", label: "Cancelada", icon: "close-circle" };
      default:
        return { color: "#999", label: estado, icon: "help-circle-outline" };
    }
  };

  if (loading) {
    return (
      <View style={styles.screen}>
        <StatusBar barStyle="light-content" backgroundColor={colors.green} />
        <Footer />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.green} />
          <Text style={styles.loadingText}>Cargando detalles...</Text>
        </View>
      </View>
    );
  }

  if (!reserva) {
    return (
      <View style={styles.screen}>
        <StatusBar barStyle="light-content" backgroundColor={colors.green} />
        <Footer />
        <View style={styles.loadingContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#999" />
          <Text style={styles.errorText}>No se encontró la reserva</Text>
          <TouchableOpacity
            style={styles.backBtnCenter}
            onPress={() => navigation.replace("ReservasRealizadas")}
          >
            <Text style={styles.backBtnText}>Volver a Mis Reservas</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const primeraCancha = reserva.items[0]?.horario.cancha;
  const badge = getEstadoBadge(reserva.estado);

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={colors.green} />
      <Footer />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.green]}
          />
        }
      >
        {/* Header */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.replace("ReservasRealizadas")}
          activeOpacity={0.85}
        >
          <Ionicons name="arrow-back" size={20} color={colors.dark} />
          <Text style={styles.backText}>Mis Reservas</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Detalle de Reserva</Text>

        {/* Estado Badge */}
        <View style={[styles.badge, { backgroundColor: badge.color }]}>
          <Ionicons name={badge.icon as any} size={18} color="#fff" />
          <Text style={styles.badgeText}>{badge.label}</Text>
        </View>

        {/* Card de la cancha */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons
              name={primeraCancha?.complejo ? "business" : "grid"}
              size={28}
              color={colors.green}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>
                {primeraCancha?.complejo?.nombre || primeraCancha?.nombre}
              </Text>
              {primeraCancha?.complejo && (
                <Text style={styles.cardSubtitle}>{primeraCancha.nombre}</Text>
              )}
              {primeraCancha?.complejo?.ciudad && (
                <Text style={styles.cardLocation}>
                  <Ionicons name="location" size={12} color={colors.dark} />{" "}
                  {primeraCancha.complejo.ciudad}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="resize" size={16} color={colors.dark} />
            <Text style={styles.infoText}>
              {getTipoLabel(primeraCancha?.tipoCancha || "")}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="leaf" size={16} color={colors.dark} />
            <Text style={styles.infoText}>
              {getTipoLabel(primeraCancha?.tipoCampo || "")}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="calendar" size={16} color={colors.dark} />
            <Text style={styles.infoText}>
              Reservado:{" "}
              {new Date(reserva.created_at).toLocaleDateString("es-ES", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </View>
        </View>

        {/* Horarios */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Horarios Reservados ({reserva.items.length})
          </Text>

          {reserva.items.map((item, index) => (
            <View key={index} style={styles.horarioCard}>
              <View style={styles.horarioRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.horarioFecha}>
                    {new Date(item.horario.fecha).toLocaleDateString("es-ES", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </Text>
                  <View style={styles.horarioTimeRow}>
                    <Ionicons name="time" size={14} color={colors.green} />
                    <Text style={styles.horarioHora}>
                      {item.horario.hora_inicio.substring(0, 5)} -{" "}
                      {item.horario.hora_fin.substring(0, 5)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.horarioPrecio}>{item.precio} Bs</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Total */}
        <View style={styles.totalCard}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total a Pagar:</Text>
            <Text style={styles.totalValue}>{calcularTotal()} Bs</Text>
          </View>
        </View>

        {/* QR de Pago */}
        {qrData && qrData.imagen_qr && (
          <View style={styles.qrSection}>
            <Text style={styles.sectionTitle}>Código QR para Pago</Text>
            <View style={styles.qrCard}>
              <Image
                source={{ uri: qrData.imagen_qr }}
                style={styles.qrImage}
                resizeMode="contain"
              />
              <Text style={styles.qrMonto}>Monto: {qrData.monto} Bs</Text>
              <Text style={styles.qrInstrucciones}>
                Escanea este código QR con tu aplicación bancaria para realizar el pago
              </Text>
            </View>
          </View>
        )}

        {/* Instrucciones */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={20} color="#2196F3" />
          <Text style={styles.infoCardText}>
            <Text style={{ fontWeight: "700" }}>Instrucciones:</Text>{"\n"}
            1. Escanea el código QR con tu app bancaria{"\n"}
            2. Realiza la transferencia por el monto indicado{"\n"}
            3. Sube una foto del comprobante de pago{"\n"}
            4. Presiona "Ya Pagué" para notificar al administrador{"\n"}
            5. Espera la confirmación del pago
          </Text>
        </View>

        {/* Subir Comprobante */}
        {reserva.estado === "pendiente" && (
          <View style={styles.comprobanteSection}>
            <Text style={styles.sectionTitle}>Comprobante de Pago</Text>
            {comprobanteUri ? (
              <View style={styles.comprobanteCard}>
                <Image source={{ uri: comprobanteUri }} style={styles.comprobanteImage} />
                <View style={styles.comprobanteActions}>
                  <TouchableOpacity
                    style={[styles.comprobanteBtn, { backgroundColor: "#E8F4FF" }]}
                    onPress={subirComprobante}
                  >
                    <Ionicons name="image-outline" size={16} color={colors.dark} />
                    <Text style={[styles.comprobanteBtnText, { color: colors.dark }]}>Cambiar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.comprobanteBtn, { backgroundColor: "#FFEAEA" }]}
                    onPress={() => setComprobanteUri(null)}
                  >
                    <Ionicons name="trash-outline" size={16} color="#B00020" />
                    <Text style={[styles.comprobanteBtnText, { color: "#B00020" }]}>Quitar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.subirComprobanteBtn}
                onPress={subirComprobante}
                activeOpacity={0.85}
              >
                <Ionicons name="camera-outline" size={32} color={colors.green} />
                <Text style={styles.subirComprobanteText}>Subir Comprobante</Text>
                <Text style={styles.subirComprobanteHint}>
                  Toma una foto o sube una imagen del comprobante de pago
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Botones de acción */}
        {reserva.estado === "pendiente" && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.pagarBtn, !comprobanteUri && { opacity: 0.6 }]}
              onPress={marcarComoPagado}
              disabled={!comprobanteUri}
              activeOpacity={0.85}
            >
              <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
              <Text style={styles.pagarText}>YA PAGUÉ</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.volverBtn}
              onPress={() => navigation.replace("ReservasRealizadas")}
              activeOpacity={0.85}
            >
              <Text style={styles.volverText}>Ver Mis Reservas</Text>
            </TouchableOpacity>
          </View>
        )}

        {reserva.estado === "confirmada" && (
          <View style={styles.successCard}>
            <Ionicons name="checkmark-circle" size={32} color={colors.green} />
            <Text style={styles.successText}>
              ¡Tu pago ha sido confirmado! Disfruta tu reserva.
            </Text>
            <TouchableOpacity
              style={styles.volverBtn}
              onPress={() => navigation.replace("Home")}
              activeOpacity={0.85}
            >
              <Text style={styles.volverText}>Volver al Inicio</Text>
            </TouchableOpacity>
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
    paddingBottom: 30,
    gap: 16,
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: colors.dark,
    opacity: 0.7,
  },
  errorText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.dark,
    marginTop: 12,
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
  },
  backText: {
    color: colors.dark,
    fontWeight: "700",
    fontSize: 14,
  },
  backBtnCenter: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: colors.green,
    borderRadius: 12,
  },
  backBtnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 14,
  },

  title: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.dark,
  },

  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 2,
  },
  badgeText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
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
    alignItems: "flex-start",
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
  cardLocation: {
    fontSize: 12,
    color: colors.dark,
    opacity: 0.6,
    marginTop: 4,
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
  },
  horarioRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  horarioFecha: {
    fontSize: 14,
    color: colors.dark,
    fontWeight: "600",
    textTransform: "capitalize",
    marginBottom: 4,
  },
  horarioTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  horarioHora: {
    fontSize: 13,
    color: colors.dark,
    fontWeight: "700",
  },
  horarioPrecio: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.green,
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
    fontSize: 18,
    fontWeight: "800",
    color: colors.dark,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.green,
  },

  // QR Section
  qrSection: {
    gap: 12,
  },
  qrCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  qrImage: {
    width: "100%",
    aspectRatio: 1,
    maxWidth: 280,
    marginBottom: 12,
  },
  qrMonto: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.green,
    marginBottom: 8,
  },
  qrInstrucciones: {
    fontSize: 13,
    color: colors.dark,
    opacity: 0.7,
    textAlign: "center",
    lineHeight: 18,
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
    lineHeight: 20,
  },

  // Acciones
  actions: {
    gap: 12,
  },
  pagarBtn: {
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
  pagarText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  volverBtn: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: colors.green,
  },
  volverText: {
    color: colors.green,
    fontSize: 15,
    fontWeight: "800",
  },

  // Success card
  successCard: {
    backgroundColor: "#E7F6EE",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    gap: 12,
    borderWidth: 2,
    borderColor: colors.green,
  },
  successText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.dark,
    textAlign: "center",
    lineHeight: 22,
  },

  // Comprobante
  comprobanteSection: {
    gap: 12,
  },
  comprobanteCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: "#E9F2EB",
    elevation: 2,
  },
  comprobanteImage: {
    width: "100%",
    aspectRatio: 4 / 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E6F1E9",
  },
  comprobanteActions: {
    flexDirection: "row",
    gap: 10,
  },
  comprobanteBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  comprobanteBtnText: {
    fontWeight: "800",
    fontSize: 13,
  },
  subirComprobanteBtn: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 2,
    borderColor: colors.green,
    borderStyle: "dashed",
  },
  subirComprobanteText: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.green,
    marginTop: 4,
  },
  subirComprobanteHint: {
    fontSize: 12,
    color: colors.dark,
    opacity: 0.6,
    textAlign: "center",
    paddingHorizontal: 20,
  },
});
