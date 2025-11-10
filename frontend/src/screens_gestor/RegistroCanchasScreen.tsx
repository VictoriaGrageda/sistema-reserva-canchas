import React, { useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  Modal,
  Pressable,
  Alert,
  Image,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker"; // imagen para subir (QR)
import colors from "../theme/colors";
import type { NavProps } from "../navigation/types";
import Footer from "../components/FooterGestor";
import { CanchasAPI, type TipoCampo, type TipoCancha, type DiaSemana, type RegistrarCanchaPayload } from "../api/canchas";
import { QRsAPI } from "../api/qrs";
import MapLocationPicker, { type LocationSelection } from "../components/MapLocationPicker";

/** ==================== Screen ==================== */
export default function RegistroCanchas({ navigation }: NavProps<"RegistroCanchas">) {
  // Campos básicos
  const [otb, setOtb] = useState("");
  const [subAlcaldia, setSubAlcaldia] = useState("");
  const [telefono, setTelefono] = useState("");
  const [ubicacion, setUbicacion] = useState<LocationSelection | null>(null);
  const [locationModalVisible, setLocationModalVisible] = useState(false);

  // QR (imagen)
  const [qrUri, setQrUri] = useState<string | null>(null); // implementacion del qr para subir

  // Estado de carga
  const [loading, setLoading] = useState(false);

  // Selects
  const tiposCampo = ["Fútbol 5", "Fútbol 6", "Fútbol 8", "Fútbol 11"];
  const tiposCancha = ["Césped sintetico", "Tierra Batida", "Césped natural"];

  const [tipoCampo, setTipoCampo] = useState<string | null>(null);
  const [tipoCancha, setTipoCancha] = useState<string | null>(null);

  // Estado para modales de selects
  const [selectOpen, setSelectOpen] = useState<null | {
    title: string;
    options: string[];
    onPick: (v: string) => void;
  }>(null);

  /** ----- acciones ----- */
  const openSelect = (title: string, options: string[], onPick: (v: string) => void) =>
    setSelectOpen({ title, options, onPick });

  const pickOption = (v: string) => {
    if (!selectOpen) return;
    selectOpen.onPick(v);
    setSelectOpen(null);
  };

  // subir QR desde galería y convertir a base64
  const pickQR = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permiso requerido", "Autoriza el acceso a tus fotos para subir el QR.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1], // cuadrado (QR)
      // Comprimir para evitar 413 en backend y acelerar subidas
      quality: 0.6,
      base64: true, // Importante: obtener base64
    });
    if (!result.canceled && result.assets[0].base64) {
      // Detectar MIME y construir data URI correcta
      const asset: any = result.assets[0];
      const mime = asset?.mimeType || 'image/jpeg';
      const base64Image = `data:${mime};base64,${asset.base64}`;
      setQrUri(base64Image);
    }
  };

  const removeQR = () => setQrUri(null); // parte de subir imagen qr al regustro de canchas


  // Mapear valores del UI a enums del backend
  // IMPORTANTE: En BD, TipoCampo = superficie, TipoCancha = tamaño
  const mapTipoCampo = (tipo: string): TipoCampo => {
    // tipoCancha del UI (superficie) -> TipoCampo del BD
    switch (tipo) {
      case "Césped sintetico": return "SINTETICO";
      case "Tierra Batida": return "TIERRA";
      case "Césped natural": return "CESPED";
      default: return "SINTETICO";
    }
  };

  const mapTipoCancha = (tipo: string): TipoCancha => {
    // tipoCampo del UI (tamaño) -> TipoCancha del BD
    switch (tipo) {
      case "Fútbol 5": return "FUT5";
      case "Fútbol 6": return "FUT6";
      case "Fútbol 8": return "FUT8";
      case "Fútbol 11": return "FUT11";
      default: return "FUT5";
    }
  };


  const onSubmit = async () => {
    // Validaciones
    if (!otb || !subAlcaldia || !telefono) {
      Alert.alert("Registro", "Completa OTB, SubAlcaldía y Celular.");
      return;
    }
    if (!tipoCampo || !tipoCancha) {
      Alert.alert("Registro", "Completa los selectores de tipos de cancha.");
      return;
    }

    setLoading(true);

    try {
      // 1. Preparar payload de la cancha
      const canchaPayload: RegistrarCanchaPayload = {
        nombre: otb,
        // tipoCampo en BD = superficie, tipoCancha en UI = superficie
        tipoCampo: mapTipoCampo(tipoCancha),
        // tipoCancha en BD = tamaño, tipoCampo en UI = tamaño
        tipoCancha: mapTipoCancha(tipoCampo),
        otb,
        subalcaldia: subAlcaldia,
        celular: telefono,
        direccion: ubicacion?.address,
        lat: ubicacion?.latitude,
        lng: ubicacion?.longitude,
      };

      // 2. Registrar la cancha
      const canchaResponse = await CanchasAPI.registrar(canchaPayload);

      // 3. Subir QR si existe
      if (qrUri) {
        try {
          console.log("📤 Subiendo QR para cancha individual...");
          const qrResponse = await QRsAPI.subir({
            imagen_qr: qrUri,
            vigente: true,
          });
          console.log("✅ QR subido correctamente:", qrResponse);
        } catch (qrError: any) {
          console.error("❌ Error al subir QR:", qrError);
          console.error("📦 Detalles del error:", {
            message: qrError.message,
            response: qrError.response?.data,
            status: qrError.response?.status,
          });
          // No bloqueamos el registro si falla el QR
          Alert.alert(
            "Advertencia",
            `La cancha se registró pero hubo un problema al subir el QR: ${qrError.response?.data?.message || qrError.message}. Puedes subir el QR más tarde desde la configuración.`
          );
        }
      } else {
        console.log("⚠️ No se proporcionó QR para la cancha individual");
      }

      Alert.alert(
        "¡Éxito!",
        "La cancha ha sido registrada correctamente. Ahora puedes configurar sus horarios y precios en la pantalla de edición.",
        [
          {
            text: "OK",
            onPress: () => navigation.navigate("CanchasRegistradas"),
          },
        ]
      );
    } catch (error: any) {
      console.error("Error al registrar cancha:", error);
      Alert.alert(
        "Error",
        error.response?.data?.message || error.message || "No se pudo registrar la cancha. Intenta nuevamente."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={colors.green} />
      <Footer />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Registro de cancha</Text>
          <Text style={styles.heroSubtitle}>
            Completa los datos de la cancha, el QR y la ubicación para poder recibir reservas y habilitar cobros.
          </Text>
        </View>

        <View style={styles.formCard}>
          <Labeled label="OTB de la cancha">
            <Input placeholder="Ingresa nombre de la otb" value={otb} onChangeText={setOtb} />
          </Labeled>

          <Labeled label="SubAlcaldía">
            <Input placeholder="Ingrese nombre de subalcaldía" value={subAlcaldia} onChangeText={setSubAlcaldia} />
          </Labeled>

          <Labeled label="Número de celular">
            <Input placeholder="xxxxxxxx" keyboardType="phone-pad" value={telefono} onChangeText={setTelefono} />
          </Labeled>

          {/* Tipos de cancha */}
          <Labeled label="Tipo de campo deportivo">
            <Select
              value={tipoCampo}
              placeholder="Seleccione tipo de campo de la cancha"
              onPress={() => openSelect("Tipo de campo", tiposCampo, setTipoCampo)}
            />
          </Labeled>

          <Labeled label="Tipo de cancha deportiva">
            <Select
              value={tipoCancha}
              placeholder="Seleccione el tipo de cancha"
              onPress={() => openSelect("Tipo de cancha", tiposCancha, setTipoCancha)}
            />
          </Labeled>

          {/* ====== subir QR ====== */}
          <Text style={styles.groupTitle}>Código QR para el cobro</Text>
          <View style={styles.qrCard}>
            {qrUri ? (
              <>
                <Image source={{ uri: qrUri }} style={styles.qrPreview} />
                <View style={styles.qrActions}>
                  <TouchableOpacity style={[styles.qrBtn, { backgroundColor: "#E8F4FF" }]} onPress={pickQR}>
                    <Ionicons name="image-outline" size={18} color={colors.dark} />
                    <Text style={[styles.qrBtnText, { color: colors.dark }]}>Reemplazar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.qrBtn, { backgroundColor: "#FFEAEA" }]} onPress={removeQR}>
                    <Ionicons name="trash-outline" size={18} color="#B00020" />
                    <Text style={[styles.qrBtnText, { color: "#B00020" }]}>Quitar</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <TouchableOpacity style={styles.qrUpload} onPress={pickQR} activeOpacity={0.9}>
                <Ionicons name="qr-code-outline" size={28} color={colors.dark} />
                <Text style={styles.qrUploadText}>Subir un QR</Text>
                <Text style={styles.qrHint}>
                  PNG / JPG (cuadrado recomendado).{"\n"}ASEGURATE QUE EL QR NO VENZA PRONTO
                </Text>
              </TouchableOpacity>
            )}
          </View>
          {/* ====== FIN de subir qr ====== */}

          {/* Ubicación */}
          <TouchableOpacity style={styles.locationBtn} onPress={() => setLocationModalVisible(true)} activeOpacity={0.85}>
            <Ionicons name="location-outline" size={18} color={colors.dark} />
            <Text style={styles.locationText}>{ubicacion?.address ?? "Seleccione Ubicación"}</Text>
          </TouchableOpacity>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submit, loading && { opacity: 0.6 }]}
            onPress={onSubmit}
            activeOpacity={0.85}
            disabled={loading}
          >
            <Text style={styles.submitText}>{loading ? "Registrando..." : "Registrar"}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ===== Modal Select Genérico ===== */}
      <Modal visible={!!selectOpen} transparent animationType="fade" onRequestClose={() => setSelectOpen(null)}>
        <Pressable style={styles.backdrop} onPress={() => setSelectOpen(null)} />
        <View style={styles.selectModalCard}>
          <Text style={styles.modalTitle}>{selectOpen?.title}</Text>
          <ScrollView style={{ maxHeight: 320 }}>
            {selectOpen?.options.map((opt) => (
              <TouchableOpacity key={opt} style={styles.optionRow} onPress={() => pickOption(opt)}>
                <Text style={styles.optionText}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
      <MapLocationPicker
        visible={locationModalVisible}
        initialLocation={ubicacion}
        onConfirm={(loc) => {
          setUbicacion(loc);
          setLocationModalVisible(false);
        }}
        onCancel={() => setLocationModalVisible(false)}
      />

    </SafeAreaView>
  );
}

/** ==================== Subcomponentes UI ==================== */
function Labeled({ label, children }: { label?: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 6 }}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      {children}
    </View>
  );
}

function Input(props: React.ComponentProps<typeof TextInput>) {
  return (
    <TextInput
      placeholderTextColor="#9AA1A5"
      style={styles.input}
      {...props}
    />
  );
}

function Select({
  value,
  placeholder,
  onPress,
}: {
  value: string | null;
  placeholder: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.select} onPress={onPress} activeOpacity={0.9}>
      <Text style={[styles.selectText, !value && { color: "#9AA1A5" }]}>
        {value ?? placeholder}
      </Text>
      <Ionicons name="chevron-down" size={18} color="#1B1B1B" />
    </TouchableOpacity>
  );
}

/** ==================== Estilos ==================== */
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.lightGreen },
  content: { padding: 20, gap: 16, paddingBottom: 32 },

  hero: { gap: 6, marginBottom: 4 },
  heroTitle: { fontSize: 24, fontWeight: "800", color: colors.dark },
  heroSubtitle: { fontSize: 14, color: colors.dark, opacity: 0.75, lineHeight: 20, maxWidth: "90%" },

  formCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    gap: 14,
    borderWidth: 1,
    borderColor: "#E6F1E9",
    ...Platform.select({
      android: { elevation: 3 },
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 5 },
      },
    }),
  },

  label: { color: "#1B1B1B", fontSize: 13, fontWeight: "700", marginLeft: 2, opacity: 0.85 },

  input: {
    height: 42,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    fontSize: 14,
    color: colors.dark,
    borderWidth: 1.5,
    borderColor: "#E6F1E9",
    ...Platform.select({
      android: { elevation: 1 },
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
      },
    }),
  },

  select: {
    height: 42,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1.5,
    borderColor: "#E6F1E9",
    ...Platform.select({
      android: { elevation: 1 },
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
      },
    }),
  },
  selectText: { color: colors.dark, fontSize: 14, fontWeight: "600" },

  groupTitle: { color: "#1B1B1B", fontWeight: "700", marginLeft: 2, marginBottom: 6 },

  // ===== tarjeta de subida QR =====
  qrCard: {
    backgroundColor: "#FDFDFD",
    borderRadius: 16,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: "#E9F2EB",
    ...Platform.select({
      android: { elevation: 2 },
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
      },
    }),
  },
  qrUpload: {
    minHeight: 120,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E6F1E9",
    backgroundColor: "#F9FCFA",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 16,
  },
  qrUploadText: { fontWeight: "800", color: colors.dark },
  qrHint: { fontSize: 12, opacity: 0.65, color: colors.dark, textAlign: "center" },
  qrPreview: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E6F1E9",
  },
  qrActions: {
    flexDirection: "row",
    gap: 10,
  },
  qrBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  qrBtnText: { fontWeight: "800" },
  // ===== FIN de foto subida de qr =====

  // Botón ubicación y submit
  locationBtn: {
    height: 44,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#E6F1E9",
  },
  locationText: { color: colors.dark, fontSize: 14, fontWeight: "600" },

  submit: {
    marginTop: 6,
    height: 46,
    borderRadius: 999,
    backgroundColor: "#17D650",
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
  },
  submitText: { color: "#fff", fontSize: 15, fontWeight: "800", letterSpacing: 0.3 },

  // Modales genéricos
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "#00000070" },
  selectModalCard: {
    position: "absolute",
    left: 20,
    right: 20,
    top: "20%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
  },
  modalTitle: { fontWeight: "800", fontSize: 16, marginBottom: 8, color: colors.dark },
  optionRow: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E9ECEF",
  },
  optionText: { fontSize: 14, color: colors.dark },
});

