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
import colors from "../theme/colors";
import Footer from "../components/FooterGestor";
import type { NavProps } from "../navigation/types";
import { CanchasAPI, type DiaSemana } from "../api/canchas";
import { HorariosAPI, type ConfiguracionHorarioPayload } from "../api/horarios";

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

const createEmptySchedule = (): DaySchedule => ({
  lun: [],
  mar: [],
  mie: [],
  jue: [],
  vie: [],
  sab: [],
  dom: [],
});

const sortRanges = (ranges: Range[]) =>
  [...ranges].sort((a, b) => a.start.localeCompare(b.start));

const toMinutes = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

const rangesOverlap = (target: Range, others: Range[]) =>
  others.some((range) =>
    Math.max(toMinutes(target.start), toMinutes(range.start)) <
    Math.min(toMinutes(target.end), toMinutes(range.end))
  );

const mapDayNameToKey = (dayName: DiaSemana): DayKey | null => {
  const reverseMap: Record<DayKey, DiaSemana> = {
    lun: "LUNES",
    mar: "MARTES",
    mie: "MIERCOLES",
    jue: "JUEVES",
    vie: "VIERNES",
    sab: "SABADO",
    dom: "DOMINGO",
  };
  const entry = (Object.keys(reverseMap) as DayKey[]).find(
    (key) => reverseMap[key] === dayName
  );
  return entry ?? null;
};

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
  const [schedule, setSchedule] = useState<DaySchedule>(() => createEmptySchedule());

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


  // Precios
  const PRECIOS = ["40 Bs", "50 Bs", "60 Bs", "70 Bs", "80 Bs", "100 Bs", "120 Bs", "150 Bs"];
  const [precioDiurno, setPrecioDiurno] = useState<string | null>(null);
  const [precioNocturno, setPrecioNocturno] = useState<string | null>(null);
  const [selectOpen, setSelectOpen] = useState<null | {
    title: string;
    options: string[];
    onPick: (v: string) => void;
  }>(null);

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

      try {
        console.log("🔍 Cargando configuraciones de horarios...");
        const configs = await HorariosAPI.obtenerConfiguraciones(cancha_id);
        const loadedSchedule = createEmptySchedule();
        configs.forEach((cfg: ConfiguracionHorarioPayload) => {
          const dayKey = mapDayNameToKey(cfg.dia_semana as DiaSemana);
          if (!dayKey) return;
          loadedSchedule[dayKey] = sortRanges([...(loadedSchedule[dayKey] ?? []), { start: cfg.hora_inicio, end: cfg.hora_fin }]);
        });
        console.log("✅ Configuraciones cargadas:", loadedSchedule);
        setSchedule(loadedSchedule);
      } catch (error: any) {
        console.warn("⚠️ No se pudieron cargar las configuraciones:", error);
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


  // ===== Manejo de horarios =====
  const openDayEditor = (dayKey: DayKey) => {
    const existingRanges = schedule[dayKey];
    console.log(`📂 Abriendo editor para ${dayKey}. Rangos existentes:`, existingRanges);
    setTempRanges([...existingRanges]);
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

    const newRange = { start: currentRange.start!, end: currentRange.end! };
    console.log("➕ Agregando nuevo rango:", newRange);

    if (rangesOverlap(newRange, tempRanges)) {
      Alert.alert("Horarios", "El rango ingresado se solapa con otro ya existente en este día.");
      return;
    }

    setTempRanges((prev) => {
      const updated = [...prev, newRange];
      console.log("📦 TempRanges actualizado:", updated);
      return updated;
    });

    setCurrentRange({ start: null, end: null });
  };

  const removeRange = (index: number) => {
    setTempRanges((prev) => prev.filter((_, i) => i !== index));
  };

  const saveDaySchedule = () => {
    if (!dayModal) return;

    // Guardar el schedule (puede estar vacío si el usuario eliminó todos los rangos)
    setSchedule((prev) => ({ ...prev, [dayModal.dayKey]: sortRanges(tempRanges) }));

    console.log(`📅 Guardando horarios para ${dayModal.dayKey}:`, tempRanges);

    setDayModal(null);
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

  const guardarCambios = async () => {
    // Validar precios
    if (!precioDiurno || !precioNocturno) {
      Alert.alert("Validación", "Debes configurar los precios diurno y nocturno.");
      return;
    }

    // Debug: Ver el estado actual de schedule
    console.log("🔍 Estado completo de schedule:", JSON.stringify(schedule, null, 2));

    // Validar que haya al menos un horario
    const diasConHorarios = DAYS.filter((d) => schedule[d.key].length > 0);

    console.log(`🔍 Días con horarios (${diasConHorarios.length}):`, diasConHorarios.map(d => `${d.label}: ${schedule[d.key].length} rangos`));

    if (diasConHorarios.length === 0) {
      Alert.alert("Validación", "Debes configurar al menos un día con horarios.");
      return;
    }

    setSaving(true);
    try {
      // 1. Actualizar precios de la cancha
      await CanchasAPI.actualizar(cancha_id, {
        precioDiurnoPorHora: extractPrecio(precioDiurno),
        precioNocturnoPorHora: extractPrecio(precioNocturno),
        diasDisponibles: diasConHorarios.map((d) => mapDiaSemana(d.key)),
      });
      console.log("✅ Precios actualizados");

      // 2. Crear configuraciones de horarios
      const configuraciones: ConfiguracionHorarioPayload[] = [];
      for (const day of DAYS) {
        const rangesForDay = schedule[day.key];
        if (rangesForDay && rangesForDay.length > 0) {
          const diaSemana = mapDiaSemana(day.key);

          for (const range of rangesForDay) {
            configuraciones.push({
              dia_semana: diaSemana,
              hora_inicio: range.start,
              hora_fin: range.end,
            });
          }
        }
      }

      // 3. Guardar configuraciones
      if (configuraciones.length > 0) {
        await HorariosAPI.guardarConfiguraciones(cancha_id, configuraciones);
        console.log("✅ Configuraciones guardadas");

        // 4. Generar bloques automáticos para los próximos 30 días
        const result = await HorariosAPI.generarBloques({
          cancha_id: cancha_id,
          configuraciones,
          diasAGenerar: 30,
          horaCorte: "18:00",
        });
        console.log(`✅ ${result.count} bloques horarios generados`);
      }

      Alert.alert(
        "¡Éxito!",
        "La cancha ha sido actualizada correctamente. Se generaron bloques horarios para los próximos 30 días.",
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

        {/* Configuración de Precios */}
        <Text style={styles.sectionTitle}>Configurar Precios</Text>
        <Text style={styles.sectionHint}>
          Define los precios por hora para horarios diurnos y nocturnos
        </Text>

        <View style={{ gap: 12 }}>
          <TouchableOpacity
            style={styles.priceSelector}
            onPress={() =>
              setSelectOpen({
                title: "Precio Diurno",
                options: PRECIOS,
                onPick: setPrecioDiurno,
              })
            }
            activeOpacity={0.8}
          >
            <Text style={styles.priceSelectorLabel}>Precio Diurno</Text>
            <Text style={styles.priceSelectorValue}>
              {precioDiurno || "Seleccionar precio"}
            </Text>
            <Ionicons name="chevron-down" size={20} color={colors.dark} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.priceSelector}
            onPress={() =>
              setSelectOpen({
                title: "Precio Nocturno",
                options: PRECIOS,
                onPick: setPrecioNocturno,
              })
            }
            activeOpacity={0.8}
          >
            <Text style={styles.priceSelectorLabel}>Precio Nocturno</Text>
            <Text style={styles.priceSelectorValue}>
              {precioNocturno || "Seleccionar precio"}
            </Text>
            <Ionicons name="chevron-down" size={20} color={colors.dark} />
          </TouchableOpacity>
        </View>

        {/* Info sobre hora de corte */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={16} color={colors.dark} />
          <Text style={styles.infoText}>
            Los horarios antes de las 18:00 usan el precio diurno.{"\n"}
            Los horarios desde las 18:00 usan el precio nocturno.
          </Text>
        </View>

        {/* Horarios por día */}
        <Text style={styles.sectionTitle}>Configurar Horarios</Text>
        <Text style={styles.sectionHint}>
          Selecciona los días que tu cancha estará disponible (mínimo 1 día)
        </Text>

        {/* Contador de días configurados */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Ionicons name="calendar" size={20} color={colors.green} />
            <Text style={styles.progressText}>
              {DAYS.filter((d) => schedule[d.key].length > 0).length} de 7 días configurados
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${
                    (DAYS.filter((d) => schedule[d.key].length > 0).length / 7) * 100
                  }%`,
                },
              ]}
            />
          </View>
          <Text style={styles.progressHint}>
            No es necesario configurar todos los días, solo los que estarás disponible
          </Text>
        </View>

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
                  <View style={styles.dayLabelContainer}>
                    <Text style={[styles.dayLabel, hasSchedule && styles.dayLabelActive]}>
                      {label}
                    </Text>
                    {hasSchedule && (
                      <View style={styles.rangeBadge}>
                        <Text style={styles.rangeBadgeText}>
                          {ranges.length} rango{ranges.length > 1 ? "s" : ""}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Ionicons
                    name={hasSchedule ? "checkmark-circle" : "add-circle-outline"}
                    size={24}
                    color={hasSchedule ? colors.green : "#999"}
                  />
                </View>
                {hasSchedule && (
                  <View style={styles.rangesPreview}>
                    {ranges.map((r, i) => (
                      <View key={i} style={styles.rangeChip}>
                        <Ionicons name="time-outline" size={14} color={colors.dark} />
                        <Text style={styles.rangeText}>
                          {r.start} - {r.end}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
                {!hasSchedule && (
                  <Text style={styles.emptyDayText}>Toca para agregar horarios</Text>
                )}
              </TouchableOpacity>
            );
          })}
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
              {/* Header mejorado */}
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleContainer}>
                  <Ionicons name="calendar" size={24} color={colors.green} />
                  <Text style={styles.modalTitle}>
                    {DAYS.find((d) => d.key === dayModal.dayKey)?.label}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setDayModal(null)}>
                  <Ionicons name="close" size={24} color={colors.dark} />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalSubtitle}>
                {tempRanges.length === 0
                  ? "Agrega los rangos horarios para este día"
                  : `${tempRanges.length} rango${tempRanges.length > 1 ? "s" : ""} configurado${tempRanges.length > 1 ? "s" : ""}`}
              </Text>

              {/* Rangos actuales */}
              {tempRanges.length > 0 && (
                <View style={styles.rangesList}>
                  {tempRanges.map((r, i) => (
                    <View key={i} style={styles.rangeItem}>
                      <View style={styles.rangeItemContent}>
                        <Ionicons name="time" size={18} color={colors.green} />
                        <Text style={styles.rangeItemText}>
                          {r.start} - {r.end}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => removeRange(i)}
                        style={styles.deleteRangeBtn}
                      >
                        <Ionicons name="trash-outline" size={18} color="#B00020" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              {/* Agregar nuevo rango */}
              <View style={styles.addRangeSection}>
                <Text style={styles.addRangeLabel}>
                  <Ionicons name="add-circle" size={16} color={colors.green} /> Nuevo rango horario
                </Text>
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
                    <Ionicons name="log-in-outline" size={16} color={colors.dark} />
                    <Text style={styles.timeSelectorText}>
                      {currentRange.start || "Inicio"}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color={colors.dark} />
                  </TouchableOpacity>

                  <Ionicons name="arrow-forward" size={16} color={colors.dark} />

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
                    <Ionicons name="log-out-outline" size={16} color={colors.dark} />
                    <Text style={styles.timeSelectorText}>
                      {currentRange.end || "Fin"}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color={colors.dark} />
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.addRangeBtn} onPress={addRange}>
                    <Ionicons name="add" size={22} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Botones */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: colors.green, flex: 2 }]}
                  onPress={saveDaySchedule}
                >
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <Text style={[styles.modalBtnText, { color: "#fff" }]}>Guardar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: "#E9ECEF", flex: 1 }]}
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

      {/* Modal de selección de precio */}
      <Modal
        visible={!!selectOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectOpen(null)}
      >
        <View style={styles.modalRoot}>
          <Pressable style={styles.backdrop} onPress={() => setSelectOpen(null)} />
          <View style={styles.timePickerCard}>
            <Text style={styles.modalTitle}>{selectOpen?.title}</Text>
            <ScrollView style={{ maxHeight: 320 }}>
              {selectOpen?.options.map((precio) => (
                <TouchableOpacity
                  key={precio}
                  style={styles.timeOption}
                  onPress={() => {
                    selectOpen.onPick(precio);
                    setSelectOpen(null);
                  }}
                >
                  <Text style={styles.timeOptionText}>{precio}</Text>
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

  // Progress card
  progressCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: "#E6F1E9",
    gap: 10,
    marginBottom: 12,
  },
  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  progressText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.dark,
  },
  progressBar: {
    height: 8,
    backgroundColor: "#E6F1E9",
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.green,
    borderRadius: 999,
  },
  progressHint: {
    fontSize: 11,
    color: colors.dark,
    opacity: 0.6,
    lineHeight: 15,
  },

  daysContainer: { gap: 10 },
  dayCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    borderWidth: 2,
    borderColor: "#E6F1E9",
    minHeight: 60,
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
  dayLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  dayLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.dark,
  },
  dayLabelActive: {
    color: colors.green,
  },
  rangeBadge: {
    backgroundColor: colors.green,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  rangeBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#fff",
  },
  rangesPreview: {
    marginTop: 10,
    gap: 6,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  rangeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#E6F1E9",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  rangeText: {
    fontSize: 12,
    color: colors.dark,
    fontWeight: "600",
  },
  emptyDayText: {
    fontSize: 12,
    color: colors.dark,
    opacity: 0.5,
    marginTop: 4,
    fontStyle: "italic",
  },

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
    maxHeight: "85%",
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  modalTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  modalTitle: {
    fontWeight: "800",
    fontSize: 20,
    color: colors.dark,
  },
  modalSubtitle: {
    fontSize: 13,
    color: colors.dark,
    opacity: 0.6,
    marginBottom: 16,
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
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D3F0DC",
  },
  rangeItemContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  rangeItemText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.dark,
  },
  deleteRangeBtn: {
    padding: 4,
  },

  addRangeSection: {
    gap: 10,
    marginBottom: 16,
    backgroundColor: "#F9FCFA",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E6F1E9",
  },
  addRangeLabel: {
    fontSize: 13,
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
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#E6F1E9",
    gap: 6,
  },
  timeSelectorText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.dark,
    flex: 1,
  },
  addRangeBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.green,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
  },

  modalActions: {
    flexDirection: "row",
    gap: 10,
  },
  modalBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
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

  // Price selector
  priceSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E6F1E9",
    gap: 8,
  },
  priceSelectorLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.dark,
    flex: 1,
  },
  priceSelectorValue: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.dark,
    opacity: 0.7,
  },

  // Info box
  infoBox: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
    backgroundColor: "#FFF8E1",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#FFE082",
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: colors.dark,
    opacity: 0.8,
    lineHeight: 16,
  },
});
