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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker"; // imagen para subir (QR)
import colors from "../theme/colors";
import type { NavProps } from "../navigation/types";
import Footer from "../components/FooterGestor";
import { CanchasAPI, type TipoCampo, type TipoCancha, type DiaSemana, type RegistrarCanchaPayload } from "../api/canchas";
import { HorariosAPI } from "../api/horarios";
import { QRsAPI } from "../api/qrs";

/** ==================== Helpers ==================== */
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

/** ==================== Screen ==================== */
export default function RegistroCanchas({ navigation }: NavProps<"RegistroCanchas">) {
  // Campos básicos
  const [otb, setOtb] = useState("");
  const [subAlcaldia, setSubAlcaldia] = useState("");
  const [telefono, setTelefono] = useState("");
  const [ubicacion, setUbicacion] = useState<string | null>(null);

  // QR (imagen)
  const [qrUri, setQrUri] = useState<string | null>(null); // implementacion del qr para subir

  // Estado de carga
  const [loading, setLoading] = useState(false);

  // Selects
  const precios = ["40 Bs", "50 Bs", "60 Bs", "70 Bs", "80 Bs"];
  const tiposCampo = ["Fútbol 5", "Fútbol 6", "Fútbol 8", "Fútbol 11"];
  const tiposCancha = ["Césped sintetico", "Tierra Batida", "Césped natural"];

  const [precioDiurno, setPrecioDiurno] = useState<string | null>(null);
  const [precioNocturno, setPrecioNocturno] = useState<string | null>(null);
  const [tipoCampo, setTipoCampo] = useState<string | null>(null);
  const [tipoCancha, setTipoCancha] = useState<string | null>(null);

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

  // Estado para modales de selects
  const [selectOpen, setSelectOpen] = useState<null | {
    title: string;
    options: string[];
    onPick: (v: string) => void;
  }>(null);

  // Estado para modal de horarios/días
  const [dayModal, setDayModal] = useState<null | {
    dayKey: DayKey;
  }>(null);

  /** ----- acciones ----- */
  const openSelect = (title: string, options: string[], onPick: (v: string) => void) =>
    setSelectOpen({ title, options, onPick });

  const pickOption = (v: string) => {
    if (!selectOpen) return;
    selectOpen.onPick(v);
    setSelectOpen(null);
  };

  const openDay = (dayKey: DayKey) => setDayModal({ dayKey });

  const addRangeToDay = (dayKey: DayKey, r: Range) => {
    if (r.end <= r.start) {
      Alert.alert("Horario inválido", "La hora fin debe ser mayor a la hora inicio.");
      return;
    }
    setSchedule((prev) => ({ ...prev, [dayKey]: [...prev[dayKey], r] }));
  };

  const removeRangeFromDay = (dayKey: DayKey, idx: number) => {
    setSchedule((prev) => ({
      ...prev,
      [dayKey]: prev[dayKey].filter((_, i) => i !== idx),
    }));
  };

  const onSelectUbicacion = () => {
    // Aquí podrías abrir un mapa o selector real
    
  };

  // subir QR desde galería
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
      quality: 0.9,
    });
    if (!result.canceled) {
      setQrUri(result.assets[0].uri);
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

  const mapDiaSemana = (key: DayKey): DiaSemana => {
    const map: Record<DayKey, DiaSemana> = {
      lun: "LUNES",
      mar: "MARTES",
      mie: "MIERCOLES",
      jue: "JUEVES",
      vie: "VIERNES",
      sab: "SABADO",
      dom: "DOMINGO",
    };
    return map[key];
  };

  const extractPrecio = (precio: string): number => {
    return parseInt(precio.replace(" Bs", ""), 10);
  };

  const onSubmit = async () => {
    // Validaciones
    if (!otb || !subAlcaldia || !telefono) {
      Alert.alert("Registro", "Completa OTB, SubAlcaldía y Celular.");
      return;
    }
    if (!precioDiurno || !precioNocturno || !tipoCampo || !tipoCancha) {
      Alert.alert("Registro", "Completa los selectores de precio y tipos.");
      return;
    }

    // Verificar que haya al menos un día con horarios
    const diasConHorarios = DAYS.filter((d) => schedule[d.key].length > 0);
    if (diasConHorarios.length === 0) {
      Alert.alert("Registro", "Debes agregar al menos un horario disponible.");
      return;
    }

    setLoading(true);

    try {
      // 1. Preparar payload de la cancha
      const diasDisponibles = diasConHorarios.map((d) => mapDiaSemana(d.key));

      const canchaPayload: RegistrarCanchaPayload = {
        nombre: otb,
        // tipoCampo en BD = superficie, tipoCancha en UI = superficie
        tipoCampo: mapTipoCampo(tipoCancha),
        // tipoCancha en BD = tamaño, tipoCampo en UI = tamaño
        tipoCancha: mapTipoCancha(tipoCampo),
        otb,
        subalcaldia: subAlcaldia,
        celular: telefono,
        diasDisponibles,
        precioDiurnoPorHora: extractPrecio(precioDiurno),
        precioNocturnoPorHora: extractPrecio(precioNocturno),
      };

      // 2. Registrar la cancha
      const canchaResponse = await CanchasAPI.registrar(canchaPayload);
      const canchaId = canchaResponse.id;

      // 3. Subir QR si existe
      if (qrUri) {
        try {
          await QRsAPI.subir({
            imagen_qr: qrUri,
            vigente: true,
          });
        } catch (qrError) {
          console.log("Error al subir QR (no crítico):", qrError);
          // No bloqueamos el registro si falla el QR
        }
      }

      // 4. Crear horarios para los próximos 30 días (empezando desde mañana)
      const today = new Date();
      const slots = [];

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
              hora_inicio: range.start + ":00", // Convertir "06:30" a "06:30:00"
              hora_fin: range.end + ":00",       // Convertir "19:00" a "19:00:00"
              disponible: true,
            });
          }
        }
      }

      // Crear horarios en bulk
      if (slots.length > 0) {
        await HorariosAPI.crearBulk({
          cancha_id: canchaId,
          slots,
        });
      }

      Alert.alert(
        "¡Éxito!",
        "La cancha ha sido registrada correctamente con sus horarios.",
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
      <Footer />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* TITULO  morado  */}
        <View style={styles.headerChip}>
          <Text style={styles.headerChipText}>REGISTRO DE CANCHA</Text>
        </View>

        {/* Formulario */}
        <View style={styles.form}>
          <Labeled label="OTB de la cancha">
            <Input placeholder="Ingresa nombre de la otb" value={otb} onChangeText={setOtb} />
          </Labeled>

          <Labeled label="SubAlcaldía">
            <Input placeholder="Ingrese nombre de subalcaldía" value={subAlcaldia} onChangeText={setSubAlcaldia} />
          </Labeled>

          <Labeled label="Número de celular">
            <Input placeholder="xxxxxxxx" keyboardType="phone-pad" value={telefono} onChangeText={setTelefono} />
          </Labeled>

          
          {/* DÍAS + HORARIOS */}
          <Text style={styles.groupTitle}>Seleccione Días disponibles</Text>
          <View style={styles.daysRow}>
            {DAYS.map((d) => {
              const active = schedule[d.key].length > 0;
              return (
                <TouchableOpacity
                  key={d.key}
                  style={[styles.dayChip, active && styles.dayChipActive]}
                  onPress={() => openDay(d.key)}
                  activeOpacity={0.9}
                >
                  <Text style={[styles.dayChipText, active && styles.dayChipTextActive]}>
                    {d.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Resumen por día */}
          <View style={{ gap: 8 }}>
            {DAYS.map((d) =>
              schedule[d.key].length ? (
                <View key={d.key} style={styles.daySummary}>
                  <Text style={styles.daySummaryTitle}>{d.label}:</Text>
                  <Text style={styles.daySummaryText}>
                    {schedule[d.key].map((r) => `${r.start}–${r.end}`).join(", ")}
                  </Text>
                </View>
              ) : null
            )}
          </View>

          {/* Precios y tipos (selects) */}
          <Labeled label="Precio Diurno por hora">
            <Select
              value={precioDiurno}
              placeholder="Seleccione precio diurno"
              onPress={() => openSelect("Precio diurno", precios, setPrecioDiurno)}
            />
          </Labeled>

          <Labeled label="Precio Nocturno por hora">
            <Select
              value={precioNocturno}
              placeholder="Seleccione precio nocturno"
              onPress={() => openSelect("Precio nocturno", precios, setPrecioNocturno)}
            />
          </Labeled>

          <Labeled label="Tipo de campo deportivo">
            <Select
              value={tipoCampo}
              placeholder="Seleccione tipo de campo de la cancha "
              onPress={() => openSelect("Tipo de campo", tiposCampo, setTipoCampo)}
            />
          </Labeled>

          <Labeled label="Tipo de cancha deportiva">
            <Select
              value={tipoCancha}
              placeholder="Seleccione el tipo de cancha "
              onPress={() => openSelect("Tipo de cancha", tiposCancha, setTipoCancha)}
            />
          </Labeled>
          
          {/* ====== subir QR  style====== */}
          <Text style={styles.groupTitle}>Código QR para el cobro </Text>
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
                <Text style={styles.qrHint}>PNG / JPG (cuadrado recomendado).{"\n"}ASEGURATE QUE EL QR NO VENZA PRONTO</Text>
              </TouchableOpacity>
            )}
          </View>
          {/* ====== FIN de subir qr imagen ====== */}


          {/* Ubicación */}
          <TouchableOpacity style={styles.locationBtn} onPress={onSelectUbicacion} activeOpacity={0.85}>
            <Ionicons name="location-outline" size={18} color={colors.dark} />
            <Text style={styles.locationText}>{ubicacion ?? "Seleccione Ubicación"}</Text>
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

      {/* ===== Modal Horarios por Día ===== */}
      <Modal visible={!!dayModal} transparent animationType="fade" onRequestClose={() => setDayModal(null)}>
        <Pressable style={styles.backdrop} onPress={() => setDayModal(null)} />
        {dayModal && (
          <DayRangesEditor
            times={TIMES}
            dayKey={dayModal.dayKey}
            ranges={schedule[dayModal.dayKey]}
            onAdd={(r) => addRangeToDay(dayModal.dayKey, r)}
            onRemove={(idx) => removeRangeFromDay(dayModal.dayKey, idx)}
            onClose={() => setDayModal(null)}
          />
        )}
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

/** Editor de rangos para un día */
function DayRangesEditor({
  times,
  dayKey,
  ranges,
  onAdd,
  onRemove,
  onClose,
}: {
  times: string[];
  dayKey: DayKey;
  ranges: Range[];
  onAdd: (r: Range) => void;
  onRemove: (idx: number) => void;
  onClose: () => void;
}) {
  const [start, setStart] = useState<string | null>(null);
  const [end, setEnd] = useState<string | null>(null);

  return (
    <View style={styles.dayModalCard}>
      <Text style={styles.modalTitle}>Horarios – {labelForDay(dayKey)}</Text>

      {/* Rangos existentes */}
      <View style={{ gap: 8, marginBottom: 8 }}>
        {ranges.length ? (
          ranges.map((r, idx) => (
            <View key={`${r.start}-${r.end}-${idx}`} style={styles.rangeRow}>
              <Text style={styles.rangeText}>{r.start} – {r.end}</Text>
              <TouchableOpacity onPress={() => onRemove(idx)} style={styles.removeBtn}>
                <Ionicons name="trash-outline" size={18} color="#B00020" />
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <Text style={{ opacity: 0.6 }}>No hay rangos para este día.</Text>
        )}
      </View>

      {/* Selector de inicio/fin */}
      <View style={styles.inline}>
        <TimeSelect label="Inicio" times={times} value={start} onChange={setStart} />
        <View style={{ width: 12 }} />
        <TimeSelect label="Fin" times={times} value={end} onChange={setEnd} />
      </View>

      <View style={styles.modalActions}>
        <TouchableOpacity
          style={[styles.modalBtn, { backgroundColor: "#E7F6EE" }]}
          onPress={() => { if (start && end) { onAdd({ start, end }); setStart(null); setEnd(null); } }}
        >
          <Text style={[styles.modalBtnText, { color: colors.dark }]}>Agregar rango</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.red }]} onPress={onClose}>
          <Text style={[styles.modalBtnText, { color: "#fff" }]}>Cerrar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function TimeSelect({
  label,
  times,
  value,
  onChange,
}: {
  label: string;
  times: string[];
  value: string | null;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={styles.select} onPress={() => setOpen(true)} activeOpacity={0.9}>
        <Text style={[styles.selectText, !value && { color: "#9AA1A5" }]}>
          {value ?? "Seleccione"}
        </Text>
        <Ionicons name="chevron-down" size={18} color="#1B1B1B" />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
        <View style={styles.selectModalCard}>
          <Text style={styles.modalTitle}>{label}</Text>
          <ScrollView style={{ maxHeight: 320 }}>
            {times.map((t) => (
              <TouchableOpacity
                key={t}
                style={styles.optionRow}
                onPress={() => { onChange(t); setOpen(false); }}
              >
                <Text style={styles.optionText}>{t}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

function labelForDay(key: DayKey) {
  return DAYS.find((d) => d.key === key)?.label ?? key;
}

/** ==================== Estilos ==================== */
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.yellow },
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

  // Días
  groupTitle: { color: "#1B1B1B", fontWeight: "700", marginLeft: 2, marginBottom: 6 },

  // ===== tarjeta de subida QR =====
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
  qrUploadText: { fontWeight: "800", color: colors.dark },
  qrHint: { fontSize: 12, opacity: 0.65, color: colors.dark, textAlign: 'center', },
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

  daySummary: { flexDirection: "row", gap: 8, alignItems: "center" },
  daySummaryTitle: { fontWeight: "800", width: 80, color: colors.dark },
  daySummaryText: { color: colors.dark },

  // Botón ubicación y submit
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
  optionRow: { paddingVertical: 12, paddingHorizontal: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#E9ECEF" },
  optionText: { fontSize: 14, color: colors.dark },

  // Modal de día/horarios
  dayModalCard: {
    position: "absolute",
    left: 20,
    right: 20,
    top: "15%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    gap: 10,
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
  },
  rangeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F7FAF8",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  rangeText: { fontWeight: "700", color: colors.dark },
  removeBtn: { padding: 6 },
  inline: { flexDirection: "row", alignItems: "flex-start" },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 10 },
  modalBtn: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modalBtnText: { fontWeight: "800" },
});
