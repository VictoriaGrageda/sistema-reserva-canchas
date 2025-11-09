import React, { useState } from "react";
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import colors from "../theme/colors";
import type { NavProps } from "../navigation/types";
import Footer from "../components/FooterGestor";
import { ComplejosAPI } from "../api/complejos";
import { QRsAPI } from "../api/qrs";
import { useAuth } from "../context/AuthContext";

/** ==================== Constantes básicas ==================== */
const TIPOS_CAMPO = ["Fútbol 5", "Fútbol 6", "Fútbol 8", "Fútbol 11"];
const TIPOS_CANCHA = ["Césped sintetico", "Tierra Batida", "Césped natural"];

type Cancha = {
  id: number;
  tipoCampo: string | null;
  tipoCancha: string | null;
};

export default function RegistroComplejoDeportivoScreen(
  { navigation }: NavProps<"RegistroComplejoDeportivo">
) {
  /** ==================== Auth ==================== */
  const { user } = useAuth();

  /** ==================== Estado del formulario ==================== */
  // Datos básicos
  const [otb, setOtb] = useState("");
  const [subAlcaldia, setSubAlcaldia] = useState("");
  const [telefono, setTelefono] = useState("");
  const [nombreComplejo, setNombreComplejo] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [ubicacion, setUbicacion] = useState<string | null>(null);


  // Canchas del complejo
  const [canchas, setCanchas] = useState<Cancha[]>([]);
  const [canchaEditor, setCanchaEditor] = useState<null | {
    idx: number | null; // null = nueva
    tipoCampo: string | null;
    tipoCancha: string | null;
  }>(null);

  // QR (imagen)
  const [qrUri, setQrUri] = useState<string | null>(null);

  // Select modal genérico (para tipos de campo/cancha)
  const [selectOpen, setSelectOpen] = useState<null | {
    title: string;
    options: string[];
    onPick: (v: string) => void;
  }>(null);

  const pickOption = (v: string) => {
    if (!selectOpen) return;
    selectOpen.onPick(v);
    setSelectOpen(null);
  };

  /** ==================== Acciones helpers ==================== */

  const pickQR = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permiso requerido", "Autoriza el acceso a tus fotos para subir el QR.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1], // cuadrado
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
  const removeQR = () => setQrUri(null);

  const onSelectUbicacion = () => {
    // TODO: Abrir un selector real de mapas
    setUbicacion("Av. Ejemplo #123, Zona Centro");
  };

  /** ===== Canchas ===== */
  const solicitarAgregarCancha = () =>
    setCanchaEditor({ idx: null, tipoCampo: null, tipoCancha: null });

  const solicitarEditarCancha = (idx: number) => {
    const c = canchas[idx];
    setCanchaEditor({ idx, tipoCampo: c.tipoCampo, tipoCancha: c.tipoCancha });
  };

  const eliminarCancha = (idx: number) => {
    Alert.alert("Eliminar", "¿Eliminar esta cancha?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Eliminar", style: "destructive", onPress: () => setCanchas((arr) => arr.filter((_, i) => i !== idx)) },
    ]);
  };

  const guardarCancha = () => {
    if (!canchaEditor) return;
    const { idx, tipoCampo, tipoCancha } = canchaEditor;
    if (!tipoCampo || !tipoCancha) {
      Alert.alert("Canchas", "Completa tipo de campo y tipo de cancha.");
      return;
    }
    if (idx === null) {
      setCanchas((arr) => [...arr, { id: Date.now(), tipoCampo, tipoCancha }]);
    } else {
      setCanchas((arr) => arr.map((c, i) => (i === idx ? { ...c, tipoCampo, tipoCancha } : c)));
    }
    setCanchaEditor(null);
  };

  /** ==================== Enviar ==================== */
  const registrarComplejo = async () => {
    try {
      // Obtener el admin_id del usuario autenticado
      const adminId = user?.id?.toString();
      if (!adminId) {
        Alert.alert("Error", "No se pudo obtener el ID del administrador. Inicia sesión nuevamente.");
        return;
      }

      // Mapeo para TipoCampo (superficie de la cancha en BD)
      const mapTipoCampo = {
        "Césped sintetico": "SINTETICO",
        "Tierra Batida": "TIERRA",
        "Césped natural": "CESPED",
      };

      // Mapeo para TipoCancha (tamaño de cancha en BD)
      const mapTipoCancha = {
        "Fútbol 5": "FUT5",
        "Fútbol 6": "FUT6",
        "Fútbol 8": "FUT8",
        "Fútbol 11": "FUT11",
      };

      const payload = {
        nombre: nombreComplejo,
        otb,
        subalcaldia: subAlcaldia,
        celular: telefono,
        telefono,
        observaciones,
        direccion: ubicacion || undefined,
        admin_id: adminId,
        canchas: canchas.map((cancha, index) => ({
          nombre: `Cancha ${index + 1}`,
          // tipoCampo en BD = superficie, tipoCancha en UI = superficie
          tipoCampo: cancha.tipoCancha ? mapTipoCampo[cancha.tipoCancha as keyof typeof mapTipoCampo] || "SINTETICO" : "SINTETICO",
          // tipoCancha en BD = tamaño, tipoCampo en UI = tamaño
          tipoCancha: cancha.tipoCampo ? mapTipoCancha[cancha.tipoCampo as keyof typeof mapTipoCancha] || "FUT5" : "FUT5",
        })),
      };

      // 1. Registrar el complejo
      const response = await ComplejosAPI.registrar(payload);
      console.log("Complejo registrado:", response);

      // 2. Subir QR si existe
      if (qrUri) {
        try {
          console.log("📤 Subiendo QR para complejo deportivo...");
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
            `El complejo se registró pero hubo un problema al subir el QR: ${qrError.response?.data?.message || qrError.message}. Puedes subir el QR más tarde desde la configuración.`
          );
        }
      } else {
        console.log("⚠️ No se proporcionó QR para el complejo");
      }

      Alert.alert(
        "¡Éxito!",
        "El complejo ha sido registrado correctamente. Ahora puedes configurar los horarios y precios de cada cancha en la pantalla de edición.",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      console.error("Error al registrar complejo:", error);
      const mensaje = error?.response?.data?.message || error?.message || "No se pudo registrar el complejo";
      Alert.alert("Error", mensaje);
    }
  };

  const onSubmit = () => {
    if (!otb || !subAlcaldia || !telefono || !nombreComplejo) {
      Alert.alert("Registro", "Completa OTB, SubAlcaldía, Celular y Nombre del complejo.");
      return;
    }
    if (!canchas.length) {
      Alert.alert("Registro", "Agrega al menos una cancha.");
      return;
    }
    registrarComplejo();
  };

  /** ==================== Render ==================== */
  return (
    <SafeAreaView style={styles.screen}>
      <Footer />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Título morado del mockup */}
        <View style={styles.headerChip}>
          <Text style={styles.headerChipText}>REGISTRO DE COMPLEJO DEPORTIVO</Text>
        </View>

        <View style={styles.form}>
          {/* Campos básicos */}
          <Labeled label="OTB de la cancha">
            <Input placeholder="Ingrese nombre de otb" value={otb} onChangeText={setOtb} />
          </Labeled>

          <Labeled label="SubAlcaldía">
            <Input placeholder="Ingrese subalcaldía" value={subAlcaldia} onChangeText={setSubAlcaldia} />
          </Labeled>

          <Labeled label="Número de celular">
            <Input placeholder="XXXXXXXX" keyboardType="phone-pad" value={telefono} onChangeText={setTelefono} />
          </Labeled>

          <Labeled label="Nombre del complejo deportivo">
            <Input placeholder="" value={nombreComplejo} onChangeText={setNombreComplejo} />
          </Labeled>

          {/* Canchas del complejo */}
          <Text style={styles.groupTitle}>Canchas del complejo</Text>

          <TouchableOpacity
            style={styles.addFieldBtn}
            onPress={solicitarAgregarCancha}
            activeOpacity={0.9}
          >
            <Ionicons name="add-circle" size={18} color={colors.dark} />
            <Text style={styles.addFieldText}>Agregar Cancha</Text>
          </TouchableOpacity>

          {/* Lista de canchas agregadas */}
          <View style={{ gap: 10 }}>
            {canchas.map((c, idx) => (
              <TouchableOpacity
                key={c.id}
                style={styles.canchaCard}
                activeOpacity={0.85}
                onPress={() => solicitarEditarCancha(idx)}     // tocar = editar
                onLongPress={() => eliminarCancha(idx)}        // mantener presionado = eliminar
              >
                <Text style={styles.canchaTitle}>CANCHA {idx + 1}</Text>
                <Text style={styles.canchaLine}>
                  Tipo de campo deportivo: <Text style={styles.canchaValue}>{c.tipoCampo}</Text>
                </Text>
                <Text style={styles.canchaLine}>
                  Tipo de cancha deportiva: <Text style={styles.canchaValue}>{c.tipoCancha}</Text>
                </Text>
                <Text style={styles.canchaHint}>(Toca para editar • Mantén presionado para eliminar)</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Observaciones */}
          <Text style={styles.groupTitle}>Observaciones</Text>
          <TextInput
            placeholder="ej: cuenta con parrillero, etc."
            placeholderTextColor="#9AA1A5"
            value={observaciones}
            onChangeText={setObservaciones}
            style={styles.textarea}
            multiline
            numberOfLines={3}
          />

          {/* Subir QR */}
          <Text style={styles.groupTitle}>Subir qr</Text>
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
                <Text style={styles.qrUploadText}>subir qr</Text>
                <Text style={styles.qrHint}>
                  PNG / JPG (cuadrado recomendado).{"\n"}Asegúrate de que el QR no venza pronto.
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Ubicación */}
          <TouchableOpacity style={styles.locationBtn} onPress={onSelectUbicacion} activeOpacity={0.85}>
            <Ionicons name="location-outline" size={18} color={colors.dark} />
            <Text style={styles.locationText}>{ubicacion ?? "Seleccione Ubicación"}</Text>
          </TouchableOpacity>

          {/* Registrar */}
          <TouchableOpacity style={styles.submit} onPress={onSubmit} activeOpacity={0.85}>
            <Text style={styles.submitText}>Registrar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ===== Modal select genérico (precios) ===== */}
      <Modal
        visible={!!selectOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectOpen(null)}
      >
        <View style={styles.modalRoot}>
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
        </View>
      </Modal>

      {/* ===== Modal “Agregar/Editar CANCHA” (según mock 2) ===== */}
      <Modal
        visible={!!canchaEditor}
        transparent
        animationType="fade"
        onRequestClose={() => setCanchaEditor(null)}
      >
        <View style={styles.modalRoot}>
          <Pressable style={styles.backdrop} onPress={() => setCanchaEditor(null)} />
          {canchaEditor && (
            <View style={styles.canchaModalCard}>
              <Text style={styles.modalTitle}>
                {canchaEditor.idx === null ? "CANCHA" : `CANCHA ${Number(canchaEditor.idx) + 1}`}
              </Text>

              <Labeled label="Tipo de campo deportivo">
                <Select
                  value={canchaEditor.tipoCampo}
                  placeholder="Seleccione"
                  onPress={() =>
                    setSelectOpen({
                      title: "Tipo de campo deportivo",
                      options: TIPOS_CAMPO,
                      onPick: (v) => setCanchaEditor((s) => (s ? { ...s, tipoCampo: v } : s)),
                    })
                  }
                />
              </Labeled>

              <Labeled label="Tipo de cancha deportiva">
                <Select
                  value={canchaEditor.tipoCancha}
                  placeholder="Seleccione"
                  onPress={() =>
                    setSelectOpen({
                      title: "Tipo de cancha deportiva",
                      options: TIPOS_CANCHA,
                      onPick: (v) => setCanchaEditor((s) => (s ? { ...s, tipoCancha: v } : s)),
                    })
                  }
                />
              </Labeled>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: "#E7F6EE" }]}
                  onPress={guardarCancha}
                >
                  <Text style={[styles.modalBtnText, { color: colors.dark }]}>Guardar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: colors.red }]}
                  onPress={() => setCanchaEditor(null)}
                >
                  <Text style={[styles.modalBtnText, { color: "#fff" }]}>Cerrar</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>
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
  return <TextInput placeholderTextColor="#9AA1A5" style={styles.input} {...props} />;
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
      <Text style={[styles.selectText, !value && { color: "#9AA1A5" }]}>{value ?? placeholder}</Text>
      <Ionicons name="chevron-down" size={18} color="#1B1B1B" />
    </TouchableOpacity>
  );
}

/** ==================== Estilos ==================== */
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.lightGreen },
  content: { padding: 20, gap: 12 },

  headerChip: {
    alignSelf: "center",
    backgroundColor: colors.purple ?? "#B673C8",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 16,
    marginTop: 4,
    marginBottom: 6,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  headerChipText: { color: "#fff", fontWeight: "800", letterSpacing: 0.3 },

  form: { gap: 12 },

  label: { color: "#1B1B1B", fontSize: 13, fontWeight: "700", marginLeft: 2, opacity: 0.85 },

  input: {
    height: 40,
    borderRadius: 10,
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
    height: 40,
    borderRadius: 10,
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

  daysRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  dayChip: {
    backgroundColor: "#E6F1E9",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  dayChipActive: { backgroundColor: "#CDE9DA" },
  dayChipText: { color: colors.dark, fontWeight: "700" },
  dayChipTextActive: {},

  addFieldBtn: {
    height: 40,
    borderRadius: 999,
    backgroundColor: "#EAF7EE",
    borderWidth: 1.5,
    borderColor: "#D3F0DC",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    alignSelf: "flex-start",
  },
  addFieldText: { color: colors.dark, fontWeight: "800" },

  canchaCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    gap: 6,
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
  canchaTitle: { fontWeight: "800", color: colors.dark, marginBottom: 2 },
  canchaLine: { color: colors.dark },
  canchaValue: { fontWeight: "700" },
  canchaHint: { fontSize: 12, opacity: 0.6 },

  textarea: {
    minHeight: 80,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingTop: 10,
    textAlignVertical: "top",
    fontSize: 14,
    color: colors.dark,
    borderWidth: 1.5,
    borderColor: "#E6F1E9",
  },

  // QR
  qrCard: {
    backgroundColor: "#fff",
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
  qrUploadText: { fontWeight: "800", color: colors.dark, textTransform: "capitalize" },
  qrHint: { fontSize: 12, opacity: 0.65, color: colors.dark, textAlign: "center" },
  qrPreview: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E6F1E9",
  },
  qrActions: { flexDirection: "row", gap: 10 },
  qrBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  qrBtnText: { fontWeight: "800" },

  locationBtn: {
    height: 40,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1.5,
    borderColor: "#E6F1E9",
  },
  locationText: { color: colors.dark, fontSize: 14, fontWeight: "600" },

  submit: {
    marginTop: 8,
    height: 44,
    borderRadius: 999,
    backgroundColor: "#1BD65A",
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
  },
  submitText: { color: "#fff", fontSize: 15, fontWeight: "800" },

  // Overlays (para que los Modals tengan un solo hijo raíz)
  modalRoot: {
    flex: 1,
  },
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

  // Modal cancha (mock 2)
  canchaModalCard: {
    position: "absolute",
    left: 20,
    right: 20,
    top: "18%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    gap: 12,
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  modalBtn: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modalBtnText: {
    fontWeight: "800",
  },
});
