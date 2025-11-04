import React, { useEffect, useState, useMemo } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import colors from "../theme/colors";
import Footer from "../components/FooterGestor";
import type { NavProps } from "../navigation/types";
import { CanchasAPI } from "../api/canchas";
import { HorariosAPI } from "../api/horarios";
import { QRsAPI } from "../api/qrs";

type DayKey = "lun" | "mar" | "mie" | "jue" | "vie" | "sab" | "dom";

const DAYS: { key: DayKey; label: string }[] = [
  { key: "lun", label: "Lunes" },
  { key: "mar", label: "Martes" },
  { key: "mie", label: "Miércoles" },
  { key: "jue", label: "Jueves" },
  { key: "vie", label: "Viernes" },
  { key: "sab", label: "Sábado" },
  { key: "dom", label: "Domingo" },
];

type Range = { start: string; end: string };
type DaySchedule = Record<DayKey, Range[]>;

const makeTimes = () => {
  const out: string[] = [];
  for (let h = 6; h <= 23; h++) {
    for (let m = 0; m < 60; m += 30) {
      const hh = String(h).padStart(2, "0");
      const mm = String(m).padStart(2, "0");
      out.push(`${hh}:${mm}`);
    }
  }
  return out;
};

export default function EditarCanchaScreen({ navigation, route }: NavProps<"EditarCancha">) {
  const { cancha_id } = route.params;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cancha, setCancha] = useState<any>(null);

  // Horarios por día
  const TIMES = useMemo(makeTimes, []);
  const [schedule, setSchedule] = useState<DaySchedule>({
    lun: [],
    mar: [],
    mie: [],
    jue: [],
    vie: [],
    sab: [],
    dom: [],
  });

  // Estado para modal de horarios
  const [dayModal, setDayModal] = useState<null | { dayKey: DayKey }>(null);
  const [tempRanges, setTempRanges] = useState<Range[]>([]);
  const [currentRange, setCurrentRange] = useState<{ start: string | null; end: string | null }>({
    start: null,
    end: null,
  });

  // Modal de selección de hora
  const [timePickerOpen, setTimePickerOpen] = useState<null | {
    type: "start" | "end";
    onPick: (time: string) => void;
  }>(null);

  // QR
  const [qrUri, setQrUri] = useState<string | null>(null);
  const [qrId, setQrId] = useState<string | null>(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      console.log("🔍 Cargando datos de cancha:", cancha_id);

      // Cargar datos de la cancha
      console.log("📡 Llamando a CanchasAPI.obtenerPorId...");
      const canchaData = await CanchasAPI.obtenerPorId(cancha_id);
      console.log("✅ Datos de cancha recibidos:", canchaData);
      setCancha(canchaData);

      // Cargar QR vigente del admin
      try {
        console.log("📡 Cargando QRs del admin...");
        const qrs = await QRsAPI.listar();
        console.log("📦 QRs recibidos:", qrs);
        const qrVigente = qrs.find((qr: any) => qr.vigente);
        if (qrVigente) {
          console.log("✅ QR vigente encontrado:", qrVigente.id);
          setQrId(qrVigente.id);
          setQrUri(qrVigente.imagen_qr);
        } else {
          console.log("⚠️ No hay QR vigente");
        }
      } catch (error: any) {
        console.log("❌ Error al cargar QRs:", error.message);
      }

      // Por ahora no cargamos horarios existentes
      // El admin configurará los horarios desde cero
      console.log("ℹ️ Horarios se configurarán desde cero");
    } catch (error: any) {
      console.error("❌ Error al cargar datos:", error);
      console.error("Error completo:", error.response?.data || error.message);
      console.error("URL intentada:", error.config?.url);
      console.error("Método:", error.config?.method);
      Alert.alert(
        "Error",
        `No se pudieron cargar los datos de la cancha.\n\n${error.response?.data?.message || error.message}`
      );
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const pickQR = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permiso requerido", "Autoriza el acceso a tus fotos para subir el QR.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });
    if (!result.canceled) {
      setQrUri(result.assets[0].uri);
      setQrId(null); // Nuevo QR, sin ID
    }
  };

  const removeQR = () => {
    setQrUri(null);
    setQrId(null);
  };

  // ===== Manejo de horarios =====
  const openDayEditor = (dayKey: DayKey) => {
    setTempRanges([...schedule[dayKey]]);
    setCurrentRange({ start: null, end: null });
    setDayModal({ dayKey });
  };

  const addRange = () => {
    if (!currentRange.start || !currentRange.end) {
      Alert.alert("Horarios", "Selecciona hora de inicio y fin.");
      return;
    }
    if (currentRange.start >= currentRange.end) {
      Alert.alert("Horarios", "La hora de fin debe ser mayor que la de inicio.");
      return;
    }
    setTempRanges((prev) => [...prev, { start: currentRange.start!, end: currentRange.end! }]);
    setCurrentRange({ start: null, end: null });
  };

  const removeRange = (index: number) => {
    setTempRanges((prev) => prev.filter((_, i) => i !== index));
  };

  const saveDaySchedule = () => {
    if (!dayModal) return;
    setSchedule((prev) => ({ ...prev, [dayModal.dayKey]: tempRanges }));
    setDayModal(null);
  };

  const guardarCambios = async () => {
    setSaving(true);
    try {
      // 1. Subir QR si hay uno nuevo
      if (qrUri && !qrId) {
        try {
          const qrResponse = await QRsAPI.crear(qrUri);
          console.log("QR creado:", qrResponse);
        } catch (error) {
          console.error("Error al crear QR:", error);
          // No bloqueamos si falla el QR
        }
      }

      // 2. Eliminar horarios existentes de la cancha
      try {
        // Aquí podrías llamar a un endpoint para eliminar horarios existentes
        // await HorariosAPI.eliminarPorCancha(cancha_id);
      } catch (error) {
        console.log("No se pudieron eliminar horarios previos");
      }

      // 3. Crear nuevos horarios para los próximos 30 días
      const slots = [];
      const today = new Date();

      for (let dayOffset = 1; dayOffset <= 30; dayOffset++) {
        const currentDate = new Date(today);
        currentDate.setDate(today.getDate() + dayOffset);

        const dayOfWeek = currentDate.getDay(); // 0 = domingo, 1 = lunes, ...
        const dayKeys: DayKey[] = ["dom", "lun", "mar", "mie", "jue", "vie", "sab"];
        const dayKey = dayKeys[dayOfWeek];

        // Si hay horarios para este día, crearlos
        const rangesForDay = schedule[dayKey];
        if (rangesForDay && rangesForDay.length > 0) {
          const dateStr = currentDate.toISOString().split("T")[0]; // YYYY-MM-DD

          for (const range of rangesForDay) {
            slots.push({
              fecha: dateStr,
              hora_inicio: range.start + ":00",
              hora_fin: range.end + ":00",
              disponible: true,
            });
          }
        }
      }

      // Crear horarios en bulk
      if (slots.length > 0) {
        await HorariosAPI.crearBulk({
          cancha_id: cancha_id,
          slots,
        });
        console.log(`✅ ${slots.length} horarios creados`);
      }

      Alert.alert(
        "¡Éxito!",
        "La cancha ha sido actualizada correctamente con sus horarios y QR.",
        [
          {
            text: "OK",
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      console.error("Error al guardar cambios:", error);
      Alert.alert(
        "Error",
        error.response?.data?.message || error.message || "No se pudieron guardar los cambios."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.screen}>
        <Footer />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.green} />
          <Text style={styles.loadingText}>Cargando datos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <Footer />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.headerChip}>
          <Text style={styles.headerChipText}>EDITAR CANCHA</Text>
        </View>

        {/* Info de la cancha */}
        <View style={styles.infoCard}>
          <Ionicons name="football" size={32} color={colors.green} />
          <View style={{ flex: 1 }}>
            <Text style={styles.infoTitle}>{cancha?.nombre}</Text>
            {cancha?.complejo && (
              <Text style={styles.infoSubtitle}>{cancha.complejo.nombre}</Text>
            )}
          </View>
        </View>

        {/* Horarios por día */}
        <Text style={styles.sectionTitle}>Configurar Horarios</Text>
        <Text style={styles.sectionHint}>
          Define los rangos de horarios disponibles para cada día de la semana
        </Text>

        <View style={styles.daysContainer}>
          {DAYS.map(({ key, label }) => {
            const ranges = schedule[key];
            const hasSchedule = ranges.length > 0;

            return (
              <TouchableOpacity
                key={key}
                style={[styles.dayCard, hasSchedule && styles.dayCardActive]}
                onPress={() => openDayEditor(key)}
                activeOpacity={0.85}
              >
                <View style={styles.dayHeader}>
                  <Text style={[styles.dayLabel, hasSchedule && styles.dayLabelActive]}>
                    {label}
                  </Text>
                  <Ionicons
                    name={hasSchedule ? "checkmark-circle" : "add-circle-outline"}
                    size={20}
                    color={hasSchedule ? colors.green : "#999"}
                  />
                </View>
                {hasSchedule && (
                  <View style={styles.rangesPreview}>
                    {ranges.map((r, i) => (
                      <Text key={i} style={styles.rangeText}>
                        {r.start} - {r.end}
                      </Text>
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* QR de Pago */}
        <Text style={styles.sectionTitle}>QR de Pago</Text>
        <Text style={styles.sectionHint}>
          Sube el código QR para que los clientes puedan realizar el pago
        </Text>

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
              <Text style={styles.qrUploadText}>Subir QR</Text>
              <Text style={styles.qrHint}>
                PNG / JPG (cuadrado recomendado).{"\n"}Asegúrate de que el QR no venza pronto.
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Botón guardar */}
        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.6 }]}
          onPress={guardarCambios}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.saveBtnText}>GUARDAR CAMBIOS</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Modal de edición de día */}
      <Modal
        visible={!!dayModal}
        transparent
        animationType="slide"
        onRequestClose={() => setDayModal(null)}
      >
        <View style={styles.modalRoot}>
          <Pressable style={styles.backdrop} onPress={() => setDayModal(null)} />
          {dayModal && (
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>
                Horarios del {DAYS.find((d) => d.key === dayModal.dayKey)?.label}
              </Text>

              {/* Rangos actuales */}
              <View style={styles.rangesList}>
                {tempRanges.map((r, i) => (
                  <View key={i} style={styles.rangeItem}>
                    <Text style={styles.rangeItemText}>
                      {r.start} - {r.end}
                    </Text>
                    <TouchableOpacity onPress={() => removeRange(i)}>
                      <Ionicons name="close-circle" size={20} color="#B00020" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              {/* Agregar nuevo rango */}
              <View style={styles.addRangeSection}>
                <Text style={styles.addRangeLabel}>Agregar rango:</Text>
                <View style={styles.addRangeRow}>
                  <TouchableOpacity
                    style={styles.timeSelector}
                    onPress={() =>
                      setTimePickerOpen({
                        type: "start",
                        onPick: (time) => {
                          setCurrentRange((prev) => ({ ...prev, start: time }));
                          setTimePickerOpen(null);
                        },
                      })
                    }
                  >
                    <Text style={styles.timeSelectorText}>
                      {currentRange.start || "Inicio"}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color={colors.dark} />
                  </TouchableOpacity>

                  <Text style={styles.rangeConnector}>-</Text>

                  <TouchableOpacity
                    style={styles.timeSelector}
                    onPress={() =>
                      setTimePickerOpen({
                        type: "end",
                        onPick: (time) => {
                          setCurrentRange((prev) => ({ ...prev, end: time }));
                          setTimePickerOpen(null);
                        },
                      })
                    }
                  >
                    <Text style={styles.timeSelectorText}>
                      {currentRange.end || "Fin"}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color={colors.dark} />
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.addRangeBtn} onPress={addRange}>
                    <Ionicons name="add" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Botones */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: colors.green }]}
                  onPress={saveDaySchedule}
                >
                  <Text style={[styles.modalBtnText, { color: "#fff" }]}>Guardar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: "#E9ECEF" }]}
                  onPress={() => setDayModal(null)}
                >
                  <Text style={[styles.modalBtnText, { color: colors.dark }]}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>

      {/* Modal de selección de hora */}
      <Modal
        visible={!!timePickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setTimePickerOpen(null)}
      >
        <View style={styles.modalRoot}>
          <Pressable style={styles.backdrop} onPress={() => setTimePickerOpen(null)} />
          <View style={styles.timePickerCard}>
            <Text style={styles.modalTitle}>
              Selecciona hora de {timePickerOpen?.type === "start" ? "inicio" : "fin"}
            </Text>
            <ScrollView style={{ maxHeight: 320 }}>
              {TIMES.map((time) => (
                <TouchableOpacity
                  key={time}
                  style={styles.timeOption}
                  onPress={() => timePickerOpen?.onPick(time)}
                >
                  <Text style={styles.timeOptionText}>{time}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.lightGreen },
  content: { padding: 20, gap: 12, paddingBottom: 40 },

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

  headerChip: {
    alignSelf: "center",
    backgroundColor: colors.purple ?? "#B673C8",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 16,
    marginTop: 4,
    marginBottom: 6,
    elevation: 2,
  },
  headerChipText: { color: "#fff", fontWeight: "800", letterSpacing: 0.3 },

  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.dark,
  },
  infoSubtitle: {
    fontSize: 13,
    color: colors.dark,
    opacity: 0.6,
    marginTop: 2,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.dark,
    marginTop: 12,
  },
  sectionHint: {
    fontSize: 12,
    color: colors.dark,
    opacity: 0.6,
    marginTop: 4,
    marginBottom: 8,
  },

  daysContainer: { gap: 10 },
  dayCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    borderWidth: 2,
    borderColor: "#E6F1E9",
  },
  dayCardActive: {
    borderColor: colors.green,
    backgroundColor: "#F0FAF4",
  },
  dayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dayLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.dark,
  },
  dayLabelActive: {
    color: colors.green,
  },
  rangesPreview: {
    marginTop: 8,
    gap: 4,
  },
  rangeText: {
    fontSize: 13,
    color: colors.dark,
    opacity: 0.7,
  },

  // QR
  qrCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: "#E9F2EB",
    elevation: 2,
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
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  qrBtnText: { fontWeight: "800" },

  saveBtn: {
    marginTop: 12,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.green,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    elevation: 4,
  },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },

  // Modales
  modalRoot: { flex: 1 },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#00000070",
  },
  modalCard: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
    maxHeight: "80%",
    elevation: 10,
  },
  modalTitle: {
    fontWeight: "800",
    fontSize: 18,
    marginBottom: 16,
    color: colors.dark,
  },

  rangesList: {
    gap: 8,
    marginBottom: 16,
  },
  rangeItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F0FAF4",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  rangeItemText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.dark,
  },

  addRangeSection: {
    gap: 8,
    marginBottom: 16,
  },
  addRangeLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.dark,
  },
  addRangeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  timeSelector: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F9FCFA",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E6F1E9",
  },
  timeSelectorText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.dark,
  },
  rangeConnector: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.dark,
  },
  addRangeBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.green,
    alignItems: "center",
    justifyContent: "center",
  },

  modalActions: {
    flexDirection: "row",
    gap: 10,
  },
  modalBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modalBtnText: {
    fontWeight: "800",
    fontSize: 15,
  },

  timePickerCard: {
    position: "absolute",
    left: 20,
    right: 20,
    top: "15%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    elevation: 10,
  },
  timeOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E9ECEF",
  },
  timeOptionText: {
    fontSize: 16,
    color: colors.dark,
    fontWeight: "600",
  },
});
