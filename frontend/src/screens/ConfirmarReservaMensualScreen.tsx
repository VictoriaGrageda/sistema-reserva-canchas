import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import colors from "../theme/colors";
import Footer from "../components/Footer";
import type { NavProps } from "../navigation/types";
import { ReservasAPI, type PreviewMensualResponse } from "../api/reservas";

type Rango = { id: string; dia_semana: string; hora_inicio: string; hora_fin: string };

const DIAS_SEMANA = [
  { key: "LUNES", label: "Lun" },
  { key: "MARTES", label: "Mar" },
  { key: "MIERCOLES", label: "Mie" },
  { key: "JUEVES", label: "Jue" },
  { key: "VIERNES", label: "Vie" },
  { key: "SABADO", label: "Sab" },
  { key: "DOMINGO", label: "Dom" },
];

const isValidHHMM = (value: string) => /^\d{2}:\d{2}$/.test(value);
const toMinutes = (value: string) => {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
};

const formatFecha = (value: string | Date) => {
  if (value instanceof Date) return value.toISOString().split("T")[0];
  return String(value).substring(0, 10);
};

const formatHora = (value: string | Date) => {
  if (value instanceof Date) return value.toISOString().substring(11, 16);
  const str = String(value);
  if (/^\d{2}:\d{2}$/.test(str)) return str;
  // Manejo cuando viene ISO string o incluye fecha
  if (str.includes("T")) {
    const slice = str.split("T")[1] || "";
    return slice.substring(0, 5);
  }
  if (str.length >= 5) return str.substring(0, 5);
  return str;
};

export default function ConfirmarReservaMensualScreen({
  navigation,
  route,
}: NavProps<"ConfirmarReserva">) {
  const { cancha, complejo } = route.params;

  const [selectedDays, setSelectedDays] = useState<Set<string>>(new Set());
  const [horaInicio, setHoraInicio] = useState("");
  const [horaFin, setHoraFin] = useState("");
  const [rangos, setRangos] = useState<Rango[]>([]);
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [tipoPlan, setTipoPlan] = useState("horario_fijo_semanal");

  const [preview, setPreview] = useState<PreviewMensualResponse | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showAllSlots, setShowAllSlots] = useState(false);

  const toggleDay = (dia: string) => {
    const next = new Set(selectedDays);
    if (next.has(dia)) next.delete(dia);
    else next.add(dia);
    setSelectedDays(next);
  };

  const ensureRanges = (): Rango[] | null => {
    if (rangos.length > 0) return rangos;
    if (selectedDays.size === 0) {
      Alert.alert("Configura horarios", "Elige al menos un dia y agrega el horario.");
      return null;
    }

    if (!isValidHHMM(horaInicio) || !isValidHHMM(horaFin)) {
      Alert.alert("Hora invalida", "Usa el formato HH:MM para inicio y fin.");
      return null;
    }

    if (toMinutes(horaFin) <= toMinutes(horaInicio)) {
      Alert.alert("Rango invalido", "La hora fin debe ser mayor que la hora inicio.");
      return null;
    }

    const generated = Array.from(selectedDays).map((dia) => ({
      id: `${dia}-${horaInicio}-${horaFin}`,
      dia_semana: dia,
      hora_inicio: horaInicio,
      hora_fin: horaFin,
    }));
    setRangos(generated);
    return generated;
  };

  const agregarRangos = () => {
    if (!isValidHHMM(horaInicio) || !isValidHHMM(horaFin)) {
      Alert.alert("Hora invalida", "Usa el formato HH:MM para inicio y fin.");
      return;
    }
    if (toMinutes(horaFin) <= toMinutes(horaInicio)) {
      Alert.alert("Rango invalido", "La hora fin debe ser mayor que la hora inicio.");
      return;
    }
    if (selectedDays.size === 0) {
      Alert.alert("Selecciona dias", "Elige al menos un dia de la semana.");
      return;
    }

    const nuevos: Rango[] = [];
    const exists = new Set(rangos.map((r) => `${r.dia_semana}-${r.hora_inicio}-${r.hora_fin}`));
    selectedDays.forEach((dia) => {
      const key = `${dia}-${horaInicio}-${horaFin}`;
      if (!exists.has(key)) {
        nuevos.push({
          id: key,
          dia_semana: dia,
          hora_inicio: horaInicio,
          hora_fin: horaFin,
        });
      }
    });

    if (nuevos.length === 0) {
      Alert.alert("Sin cambios", "Ese rango ya esta agregado.");
      return;
    }

    setRangos((prev) => [...prev, ...nuevos]);
  };

  const buildPayload = (ranges: Rango[]) => ({
    cancha_id: cancha.id,
    rangos: ranges.map((r) => ({
      dia_semana: r.dia_semana,
      hora_inicio: r.hora_inicio,
      hora_fin: r.hora_fin,
    })),
    fecha_inicio: fechaInicio || undefined,
    fecha_fin: fechaFin || undefined,
    tipo_plan: tipoPlan || undefined,
  });

  const calcularPreview = async () => {
    const ranges = ensureRanges();
    if (!ranges) return;

    setLoadingPreview(true);
    setPreview(null);
    setShowAllSlots(false);
    try {
      const payload = buildPayload(ranges);
      const resp = await ReservasAPI.previewMensual(payload);
      setPreview(resp?.data || resp);
    } catch (e: any) {
      Alert.alert("Error", e?.response?.data?.message || e?.message || "No se pudo calcular la mensualidad");
    } finally {
      setLoadingPreview(false);
    }
  };

  const confirmar = async () => {
    const ranges = ensureRanges();
    if (!ranges) return;

    const crear = async () => {
      setCreating(true);
      try {
        const payload = buildPayload(ranges);
        const resp = await ReservasAPI.crearMensual(payload);
        const reservaId = resp?.data?.id || resp?.id;
        if (!reservaId) {
          throw new Error("No se obtuvo el ID de la reserva");
        }
        const faltantes = resp?.data?.missingSlots || resp?.missingSlots || [];
        const listado = Array.isArray(faltantes)
          ? faltantes.slice(0, 3).map((m: any) => `${m.fecha} ${m.hora_inicio}-${m.hora_fin}`).join("\n")
          : "";
        const mensajeBase = faltantes.length
          ? `Se reservo lo disponible. ${faltantes.length} horarios no se pudieron agregar.`
          : "Tu mensualidad fue creada correctamente.";
        const mensaje = listado ? `${mensajeBase}\n\nFaltantes:\n${listado}` : mensajeBase;

        Alert.alert("Reserva creada", mensaje, [
          {
            text: "Ver QR",
            onPress: () => navigation.replace("DetalleReservaQR", { reserva_id: reservaId }),
          },
        ]);
      } catch (e: any) {
        const missing = e?.response?.data?.missingSlots;
        if (Array.isArray(missing) && missing.length > 0) {
          const listado = missing
            .map((m: any) => `${m.fecha} ${m.hora_inicio}-${m.hora_fin}`)
            .join("\n");
          Alert.alert(
            e?.response?.data?.message || "No se pudo crear la mensualidad",
            `Horarios faltantes:\n${listado}`
          );
        } else {
          Alert.alert("Error", e?.response?.data?.message || e?.message || "No se pudo crear la mensualidad");
        }
      } finally {
        setCreating(false);
      }
    };

    if (preview?.missing?.length) {
      Alert.alert(
        "Horarios faltantes",
        "Se reservara solo lo disponible. Los faltantes no se incluiran en la mensualidad.",
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Reservar igual", onPress: () => crear() },
        ]
      );
      return;
    }

    await crear();
  };

  const totalPreview = preview?.total ?? 0;
  const sesionesTexto = useMemo(() => {
    if (!preview) return null;
    return `${preview.count} de ${preview.expected} sesiones disponibles`;
  }, [preview]);

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={colors.green} />
      <Footer />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={colors.dark} />
          <Text style={styles.backText}>Volver</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Reserva mensual</Text>
        <Text style={styles.subtitle}>
          {complejo ? `${complejo.nombre} - ${cancha.nombre}` : cancha.nombre}
        </Text>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name={complejo ? "business" : "grid"} size={26} color={colors.green} />
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{complejo ? complejo.nombre : cancha.nombre}</Text>
              {complejo && <Text style={styles.cardSubtitle}>{cancha.nombre}</Text>}
            </View>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="resize" size={16} color={colors.dark} />
            <Text style={styles.infoText}>{cancha.tipoCancha}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="leaf" size={16} color={colors.dark} />
            <Text style={styles.infoText}>{cancha.tipoCampo}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="calendar" size={24} color={colors.green} />
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Configura tus dias y horas</Text>
              <Text style={styles.cardSubtitle}>Elegir dias de la semana y horarios a bloquear</Text>
            </View>
          </View>

          <Text style={styles.label}>Dias de la semana</Text>
          <View style={styles.daysRow}>
            {DIAS_SEMANA.map((d) => {
              const active = selectedDays.has(d.key);
              return (
                <TouchableOpacity
                  key={d.key}
                  style={[styles.dayChip, active && styles.dayChipActive]}
                  onPress={() => toggleDay(d.key)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.dayChipText, active && styles.dayChipTextActive]}>{d.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.timeRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Hora inicio</Text>
              <TextInput
                value={horaInicio}
                onChangeText={setHoraInicio}
                placeholder="00:00"
                style={styles.input}
                autoCapitalize="none"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Hora fin</Text>
              <TextInput
                value={horaFin}
                onChangeText={setHoraFin}
                placeholder="00:00"
                style={styles.input}
                autoCapitalize="none"
              />
            </View>
          </View>

          <TouchableOpacity style={styles.addBtn} onPress={agregarRangos} activeOpacity={0.85}>
            <Ionicons name="add-circle" size={18} color="#fff" />
            <Text style={styles.addBtnText}>Agregar al plan</Text>
          </TouchableOpacity>

          {rangos.length > 0 && (
            <View style={{ marginTop: 10, gap: 8 }}>
              <Text style={styles.label}>Rangos agregados</Text>
              {rangos.map((r) => (
                <View key={r.id} style={styles.rangoRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rangoDia}>{r.dia_semana}</Text>
                    <Text style={styles.rangoHora}>
                      {r.hora_inicio} - {r.hora_fin}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setRangos((prev) => prev.filter((x) => x.id !== r.id))}>
                    <Ionicons name="trash" size={18} color={colors.red} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="calendar-outline" size={22} color={colors.green} />
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Periodo del plan</Text>
            </View>
          </View>

          <View style={styles.timeRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Fecha inicio (YYYY-MM-DD)</Text>
              <TextInput
                value={fechaInicio}
                onChangeText={setFechaInicio}
                placeholder="2025-12-01"
                style={styles.input}
                autoCapitalize="none"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Fecha fin (YYYY-MM-DD)</Text>
              <TextInput
                value={fechaFin}
                onChangeText={setFechaFin}
                placeholder="2025-12-30"
                style={styles.input}
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={{ marginTop: 10 }}>
            <Text style={styles.label}>Tipo de plan</Text>
            <View style={styles.tipoRow}>
              {["horario_fijo_semanal", "personalizado"].map((opt) => {
                const active = tipoPlan === opt;
                return (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.tipoChip, active && styles.tipoChipActive]}
                    onPress={() => setTipoPlan(opt)}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.tipoChipText, active && styles.tipoChipTextActive]}>
                      {opt === "horario_fijo_semanal" ? "Horario fijo semanal" : "Personalizado"}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.confirmBtn, loadingPreview && { opacity: 0.7 }]}
          onPress={calcularPreview}
          disabled={loadingPreview}
          activeOpacity={0.85}
        >
          {loadingPreview ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmText}>CALCULAR MENSUALIDAD</Text>}
        </TouchableOpacity>

        {preview && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="stats-chart" size={22} color={colors.green} />
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Resultado de vista previa</Text>
                {preview.periodo && (
                  <Text style={styles.cardSubtitle}>
                    {preview.periodo.inicio} - {preview.periodo.fin}
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Sesiones</Text>
              <Text style={styles.previewValue}>{sesionesTexto}</Text>
            </View>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Total a pagar</Text>
              <Text style={styles.previewTotal}>{totalPreview} Bs</Text>
            </View>
            {preview.missing?.length > 0 && (
              <View style={{ marginTop: 10 }}>
                <View style={styles.missingHeader}>
                  <Ionicons name="alert-circle" size={18} color={colors.red} />
                  <Text style={styles.missingTitle}>Horarios faltantes ({preview.missing.length})</Text>
                </View>
                {preview.missing.slice(0, 5).map((m) => (
                  <Text key={`${m.fecha}-${m.hora_inicio}-${m.hora_fin}`} style={styles.missingItem}>
                    {m.fecha} {m.hora_inicio}-{m.hora_fin}
                  </Text>
                ))}
                {preview.missing.length > 5 && (
                  <Text style={styles.missingMore}>... y {preview.missing.length - 5} mas</Text>
                )}
              </View>
            )}

            {preview.slots?.length > 0 && (
              <View style={{ marginTop: 10 }}>
                <Text style={styles.label}>Sesiones agendadas</Text>
                {(showAllSlots ? preview.slots : preview.slots.slice(0, 6)).map((s) => (
                  <View key={s.id} style={styles.slotRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.slotFecha}>{formatFecha(s.fecha)}</Text>
                      <Text style={styles.slotHora}>
                        {formatHora(s.hora_inicio)} - {formatHora(s.hora_fin)}
                      </Text>
                    </View>
                    <Text style={styles.slotPrecio}>{s.precio} Bs</Text>
                  </View>
                ))}
                {preview.slots.length > 6 && !showAllSlots && (
                  <TouchableOpacity onPress={() => setShowAllSlots(true)}>
                    <Text style={styles.missingMore}>... {preview.slots.length - 6} sesiones mas (ver todas)</Text>
                  </TouchableOpacity>
                )}
                {showAllSlots && preview.slots.length > 6 && (
                  <TouchableOpacity onPress={() => setShowAllSlots(false)}>
                    <Text style={styles.missingMore}>Mostrar solo las primeras 6</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.confirmBtn,
            creating && { opacity: 0.7 },
            { marginBottom: 20 },
          ]}
          onPress={confirmar}
          disabled={creating}
          activeOpacity={0.85}
        >
          {creating ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmText}>CONFIRMAR RESERVA</Text>}
        </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.lightGreen },
  content: { padding: 20, gap: 12 },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  backText: { color: colors.dark, fontWeight: "700" },
  title: { fontSize: 22, fontWeight: "800", color: colors.dark, marginTop: 6 },
  subtitle: { fontSize: 13, color: colors.dark, opacity: 0.7, marginBottom: 4 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    gap: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#E6F1E9",
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 6 },
  cardTitle: { fontSize: 16, fontWeight: "800", color: colors.dark },
  cardSubtitle: { fontSize: 12, color: colors.dark, opacity: 0.7 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  infoText: { color: colors.dark, fontWeight: "600" },
  label: { fontSize: 13, fontWeight: "700", color: colors.dark, marginBottom: 6 },
  daysRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  dayChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E6F1E9",
    backgroundColor: "#F7FAF8",
  },
  dayChipActive: { backgroundColor: colors.green, borderColor: colors.green },
  dayChipText: { color: colors.dark, fontWeight: "700" },
  dayChipTextActive: { color: "#fff" },
  timeRow: { flexDirection: "row", gap: 10, marginTop: 6 },
  input: {
    backgroundColor: "#F7FAF8",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#E6F1E9",
    color: colors.dark,
  },
  addBtn: {
    marginTop: 12,
    backgroundColor: colors.green,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  addBtnText: { color: "#fff", fontWeight: "800" },
  rangoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F7FAF8",
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "#E6F1E9",
  },
  rangoDia: { fontWeight: "800", color: colors.dark },
  rangoHora: { color: colors.dark, opacity: 0.8 },
  tipoRow: { flexDirection: "row", gap: 8, marginTop: 6 },
  tipoChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E6F1E9",
    backgroundColor: "#F7FAF8",
    alignItems: "center",
  },
  tipoChipActive: { backgroundColor: colors.green, borderColor: colors.green },
  tipoChipText: { color: colors.dark, fontWeight: "700" },
  tipoChipTextActive: { color: "#fff" },
  confirmBtn: {
    backgroundColor: colors.green,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    marginTop: 4,
    elevation: 2,
  },
  confirmText: { color: "#fff", fontWeight: "800" },
  previewRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  previewLabel: { color: colors.dark, fontWeight: "700" },
  previewValue: { color: colors.dark, fontWeight: "700" },
  previewTotal: { color: colors.green, fontWeight: "800", fontSize: 18 },
  missingHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10 },
  missingTitle: { color: colors.red, fontWeight: "800" },
  missingItem: { color: colors.dark, opacity: 0.8, marginTop: 2 },
  missingMore: { color: colors.dark, opacity: 0.6, marginTop: 4 },
  slotRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#E6F1E9",
  },
  slotFecha: { color: colors.dark, fontWeight: "700" },
  slotHora: { color: colors.dark, opacity: 0.8 },
  slotPrecio: { color: colors.green, fontWeight: "800" },
});
