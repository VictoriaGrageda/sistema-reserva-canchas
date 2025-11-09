import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import colors from "../theme/colors";
import Footer from "../components/Footer";
import type { NavProps } from "../navigation/types";
import { ReservasAPI } from "../api/reservas";
import { HorariosAPI } from "../api/horarios";
import WeeklyRepeatGrid from "../components/WeeklyRepeatGrid";

export default function ConfirmarReservaScreen({
  navigation,
  route,
}: NavProps<"ConfirmarReserva">) {
  const { cancha, complejo, horarios, tipoReserva } = route.params;
  const [loading, setLoading] = useState(false);

  // Total diario (si aplica)
  const totalDiario = useMemo(() => horarios.reduce((sum, h) => sum + (h.precio || 0), 0), [horarios]);

  // Mensual: cargar configuraciones de la cancha -> rangos -> preview mensual (slots/total)
  const [rangosMensuales, setRangosMensuales] = useState<Array<{ dia_semana: string; hora_inicio: string; hora_fin: string }>>([]);
  const [selectedConfigKeys, setSelectedConfigKeys] = useState<Set<string>>(new Set());
  const [previewLoading, setPreviewLoading] = useState(false);
  const [preview, setPreview] = useState<{ count: number; total: number; slots: Array<{ id: string; fecha: string; hora_inicio: string; hora_fin: string; precio: number }> } | null>(null);
  const [selectedMonthly, setSelectedMonthly] = useState<Set<string>>(new Set());
  const [weeks, setWeeks] = useState<[boolean,boolean,boolean,boolean]>([true,true,true,true]);
  const [dayHoursPicker, setDayHoursPicker] = useState<string | null>(null);
  const weekRanges = React.useMemo(() => {
    if (!preview || !Array.isArray(preview.slots) || preview.slots.length === 0) return undefined;
    // Anchor: lunes de la semana del mínimo slot
    const first = preview.slots[0];
    const minDate = preview.slots.reduce((min, s) => {
      const d = new Date(s.fecha);
      return d < min ? d : min;
    }, new Date(first.fecha));
    const anchor = new Date(minDate);
    const dow = anchor.getDay();
    const deltaToMonday = (dow + 6) % 7;
    anchor.setDate(anchor.getDate() - deltaToMonday);
    const fmt = (d: Date) => `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`;
    const ranges: Array<{ start: string; end: string }> = [];
    for (let w=0; w<4; w++) {
      const start = new Date(anchor);
      start.setDate(anchor.getDate() + w*7);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      ranges.push({ start: fmt(start), end: fmt(end) });
    }
    return ranges;
  }, [preview]);

  useEffect(() => {
    (async () => {
      if (tipoReserva !== 'mensual') return;
      try {
        // 1) Obtener configuraciones para la cancha
        const cfgResp = await HorariosAPI.obtenerConfiguraciones(cancha.id);
        const cfg = cfgResp?.data ?? cfgResp ?? [];
        if (Array.isArray(cfg) && cfg.length > 0) {
          const rangos = cfg.map((c: any) => ({
            dia_semana: String(c.dia_semana).toUpperCase(),
            hora_inicio: c.hora_inicio,
            hora_fin: c.hora_fin,
          }));
          setRangosMensuales(rangos);
          // Generar horas por día (60 min) y seleccionar todas por defecto
          const toMin = (hhmm: string) => { const [h,m]=hhmm.split(':').map(Number); return h*60+(m||0); };
          const toStr = (mins: number) => { const h = Math.floor(mins/60)%24; const m=mins%60; return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`; };
          const keys = new Set<string>();
          rangos.forEach((r) => {
            const start = toMin(r.hora_inicio); const end = toMin(r.hora_fin);
            for (let t=start; t<end; t+=60) keys.add(`${r.dia_semana}|${toStr(t)}`);
          });
          setSelectedConfigKeys(keys);
        } else {
          setRangosMensuales([]);
          setSelectedConfigKeys(new Set());
        }
      } catch {
        setRangosMensuales([]);
        setSelectedConfigKeys(new Set());
      }
    })();
  }, [tipoReserva, cancha.id]);

  useEffect(() => {
    (async () => {
      if (tipoReserva !== 'mensual') { setPreview(null); return; }
      if (rangosMensuales.length === 0) { setPreview(null); return; }
      setPreviewLoading(true);
      try {
        // Expandir a segmentos de 1 hora: si hay horas seleccionadas por día, usar esas; si no, expandir todas las configuraciones
        const hourSegments: Array<{ dia_semana: string; hora_inicio: string; hora_fin: string }> = [];
        const toMin = (hhmm: string) => { const [h,m]=hhmm.split(':').map(Number); return h*60+(m||0); };
        const toStr = (mins: number) => { const h = Math.floor(mins/60)%24; const m=mins%60; return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`; };

        if (selectedConfigKeys.size > 0) {
          // selectedConfigKeys guarda DAY|HH:MM
          selectedConfigKeys.forEach(k => {
            const [day, hh] = k.split('|');
            const start = hh;
            const end = toStr(toMin(hh) + 60);
            hourSegments.push({ dia_semana: day, hora_inicio: start, hora_fin: end });
          });
        } else {
          // Expandir todas las configuraciones de franja a segmentos de 1h
          rangosMensuales.forEach(r => {
            for (let t = toMin(r.hora_inicio); t < toMin(r.hora_fin); t += 60) {
              const start = toStr(t);
              const end = toStr(t + 60);
              hourSegments.push({ dia_semana: r.dia_semana, hora_inicio: start, hora_fin: end });
            }
          });
        }

        const resp = await ReservasAPI.previewMensual({ cancha_id: cancha.id, rangos: hourSegments } as any);
        const data = resp?.data ?? resp;
        setPreview({
          count: Number(data?.count ?? 0),
          total: Number(data?.total ?? 0),
          slots: Array.isArray(data?.slots) ? data.slots : [],
        });
      } catch {
        setPreview(null);
      } finally {
        setPreviewLoading(false);
      }
    })();
  }, [tipoReserva, cancha.id, rangosMensuales, selectedConfigKeys]);

  // Selección automática por semanas (7 días x 4 semanas)
  useEffect(() => {
    if (tipoReserva !== 'mensual' || !preview || !Array.isArray(preview.slots) || preview.slots.length === 0) {
      setSelectedMonthly(new Set());
      return;
    }
    // Anchor: lunes de la semana del mínimo slot
    const first = preview.slots[0];
    if (!first) { setSelectedMonthly(new Set()); return; }
    const minDate = preview.slots.reduce((min, s) => {
      const d = new Date(s.fecha);
      return d < min ? d : min;
    }, new Date(first.fecha));
    const anchor = new Date(minDate);
    const dow = anchor.getDay(); // 0=dom,1=lun
    const deltaToMonday = (dow + 6) % 7; // 0 for monday
    anchor.setDate(anchor.getDate() - deltaToMonday);

    const cfgKeys = selectedConfigKeys.size > 0
      ? selectedConfigKeys
      : (() => {
          const toMin = (hhmm: string) => { const [h,m]=hhmm.split(':').map(Number); return h*60+(m||0); };
          const toStr = (mins: number) => { const h = Math.floor(mins/60)%24; const m=mins%60; return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`; };
          const keys = new Set<string>();
          rangosMensuales.forEach((r) => {
            const start = toMin(r.hora_inicio); const end = toMin(r.hora_fin);
            for (let t=start; t<end; t+=60) keys.add(`${r.dia_semana}|${toStr(t)}`);
          });
          return keys;
        })();

    const newSel = new Set<string>();
    preview.slots.forEach(s => {
      const d = new Date(s.fecha);
      const diffDays = Math.floor((+d - +anchor)/(24*60*60*1000));
      const w = Math.floor(diffDays/7);
      if (w < 0 || w > 3) return;
      if (!weeks[w]) return;
      const dowS = d.getDay();
      const names = ['DOMINGO','LUNES','MARTES','MIERCOLES','JUEVES','VIERNES','SABADO'];
      const startStr = String(s.hora_inicio);
      const hIni = startStr.includes('T') ? startStr.substring(11,16) : startStr.substring(0,5);
      const key = `${names[dowS]}|${hIni}`;
      if (cfgKeys.has(key)) newSel.add(s.id);
    });
    setSelectedMonthly(newSel);
  }, [tipoReserva, preview, rangosMensuales, selectedConfigKeys, weeks]);

  // Total mensual seleccionado
  const totalMensualSeleccionado = useMemo(() => {
    if (tipoReserva !== 'mensual' || !preview) return 0;
    if (selectedMonthly.size === 0) return 0;
    const map = new Map(preview.slots.map(s => [s.id, Number(s.precio || 0)]));
    let sum = 0;
    selectedMonthly.forEach(id => { sum += map.get(id) || 0; });
    return sum;
  }, [tipoReserva, preview, selectedMonthly]);

  const confirmar = async () => {
    setLoading(true);
    try {
      let resp: any;
      if (tipoReserva === "mensual") {
        if (!preview || !Array.isArray(preview.slots) || preview.slots.length === 0) {
          Alert.alert("Reserva mensual", "No hay horarios disponibles para las configuraciones actuales.");
          return;
        }
        // Construir payload por slots (si no hay selección, usar todos los del preview)
        const ids = (selectedMonthly.size > 0)
          ? Array.from(selectedMonthly)
          : preview.slots.map(s => s.id);
        const precios = new Map(preview.slots.map(s => [s.id, Number(s.precio || 0)]));
        const horariosPayload = ids.map(id => ({ horario_id: id, precio: precios.get(id) || 0 }));
        resp = await ReservasAPI.crear({ horarios: horariosPayload, tipo_reserva: 'mensual' } as any);
      } else {
        resp = await ReservasAPI.crear({
          horarios: horarios.map((x) => ({ horario_id: x.id, precio: x.precio })),
          tipo_reserva: "diaria",
        });
      }

      const reservaId = resp?.data?.id || resp?.id;
      if (!reservaId) {
        throw new Error("No se obtuvo el ID de la reserva");
      }
      Alert.alert("Reserva creada", "Tu reserva ha sido creada correctamente.", [
        { text: "Ver QR", onPress: () => navigation.replace("DetalleReservaQR", { reserva_id: reservaId }) },
      ]);
    } catch (e: any) {
      Alert.alert("Error", e?.response?.data?.message || e?.message || "No se pudo crear la reserva");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={colors.green} />
      <Footer />

      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={colors.dark} />
          <Text style={styles.backText}>Volver</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Confirmar Reserva</Text>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name={complejo ? "business" : "grid"} size={28} color={colors.green} />
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
            <Ionicons name={tipoReserva === 'mensual' ? "calendar" : "today"} size={24} color={colors.green} />
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Tipo de Reserva</Text>
              <Text style={styles.cardSubtitle}>{tipoReserva === 'mensual' ? 'Mensual' : 'Diaria'}</Text>
            </View>
          </View>
          {tipoReserva === 'mensual' && (
            <View style={{ gap: 8 }}>
              <Text style={styles.infoText}>
                Días: {Array.from(new Set(rangosMensuales.map(r => r.dia_semana))).join(', ') || 'Sin configuraciones'}
              </Text>
              {previewLoading ? (
                <ActivityIndicator color={colors.green} />
              ) : preview ? (
                <Text style={styles.infoText}>Sesiones: {preview.count} • Total estimado: {preview.total} Bs</Text>
              ) : null}
            </View>
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="time" size={24} color={colors.green} />
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{tipoReserva === 'mensual' ? 'Calendario mensual' : 'Horarios seleccionados'}</Text>
              <Text style={styles.cardSubtitle}>{tipoReserva === 'mensual' ? 'Solo se muestran días/horarios configurados' : 'Resumen'}</Text>
            </View>
          </View>
          {tipoReserva === 'mensual' ? (
            preview && preview.slots ? (
              <>
                <WeeklyRepeatGrid
                  config={rangosMensuales}
                  weeks={weeks}
                  onToggleWeek={(i) => setWeeks((prev) => {
                    const arr: [boolean,boolean,boolean,boolean] = [...prev] as any;
                    arr[i] = !arr[i];
                    return arr;
                  })}
                  selectedCounts={(() => {
                    const counts: Record<string, number> = {};
                    Array.from(selectedConfigKeys).forEach(k => {
                      const [day] = k.split('|');
                      counts[day] = (counts[day] || 0) + 1;
                    });
                    return counts;
                  })()}
                  selectedSummary={(() => {
                    const byDay: Record<string, string> = {};
                    const tmp: Record<string, string[]> = {};
                    Array.from(selectedConfigKeys).forEach(k => {
                      const [day, hh] = k.split('|');
                      (tmp[day] ||= []).push(hh);
                    });
                    Object.keys(tmp).forEach(day => {
                      const arr = tmp[day].sort();
                      if (arr.length > 0) byDay[day] = `${arr[0]} - ${arr[arr.length-1]}`;
                    });
                    return byDay;
                  })()}
                  onOpenDay={(day) => {
                    setDayHoursPicker(day);
                  }}
                  weekRanges={weekRanges}
                />
                <View style={{ gap: 10, marginTop: 12 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={styles.infoText}>Seleccionados: {selectedMonthly.size}</Text>
                    <Text style={[styles.infoText, { fontWeight: '800' }]}>Total selección: {totalMensualSeleccionado} Bs</Text>
                  </View>
                </View>
              </>
            ) : (
              <Text style={styles.infoText}>No hay sesiones configuradas.</Text>
            )
          ) : (
            horarios.map((h) => (
              <View key={h.id} style={styles.horarioRow}>
                <Text style={styles.horarioText}>{h.fecha} • {h.hora_inicio.substring(0,5)}-{h.hora_fin.substring(0,5)}</Text>
                <Text style={styles.horarioPrecio}>{h.precio} Bs</Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.totalCard}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total a Pagar:</Text>
            <Text style={styles.totalValue}>{tipoReserva === 'mensual' ? (selectedMonthly.size > 0 ? totalMensualSeleccionado : (preview?.total ?? 0)) : totalDiario} Bs</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.confirmBtn, loading && { opacity: 0.6 }]}
          onPress={confirmar}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.confirmText}>CONFIRMAR RESERVA</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Modal de selección de horas por día */}
      {tipoReserva === 'mensual' && dayHoursPicker && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Horas para {dayHoursPicker[0] + dayHoursPicker.slice(1).toLowerCase()}</Text>
            <ScrollView style={{ maxHeight: 320 }} contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {(() => {
                // Construir horas válidas según configuraciones
                const toMin = (hhmm: string) => { const [h,m]=hhmm.split(':').map(Number); return h*60+(m||0); };
                const toStr = (mins: number) => { const h = Math.floor(mins/60)%24; const m=mins%60; return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`; };
                const hoursSet = new Set<string>();
                // Preferir slots reales del preview (respetando semanas activas)
                if (preview && Array.isArray(preview.slots) && preview.slots.length > 0) {
                  const names = ['DOMINGO','LUNES','MARTES','MIERCOLES','JUEVES','VIERNES','SABADO'];
                  const first = preview.slots[0];
                  const minDate = preview.slots.reduce((min, s) => {
                    const d = new Date(s.fecha);
                    return d < min ? d : min;
                  }, new Date(first.fecha));
                  const anchor = new Date(minDate);
                  const dow = anchor.getDay();
                  const deltaToMonday = (dow + 6) % 7;
                  anchor.setDate(anchor.getDate() - deltaToMonday);

                  preview.slots.forEach(s => {
                    const d = new Date(s.fecha);
                    const diffDays = Math.floor((+d - +anchor)/(24*60*60*1000));
                    const w = Math.floor(diffDays/7);
                    if (w < 0 || w > 3) return;
                    if (!weeks[w]) return;
                    const dayName = names[d.getDay()];
                    if (dayName !== dayHoursPicker) return;
                    const startStr = String(s.hora_inicio);
                    const hIni = startStr.includes('T') ? startStr.substring(11,16) : startStr.substring(0,5);
                    hoursSet.add(hIni);
                  });
                }

                // Fallback a configuraciones si aún no hay preview
                if (hoursSet.size === 0) {
                  rangosMensuales.filter(r => r.dia_semana === dayHoursPicker).forEach(r => {
                    for (let t=toMin(r.hora_inicio); t<toMin(r.hora_fin); t+=60) hoursSet.add(toStr(t));
                  });
                }
                const hours = Array.from(hoursSet).sort();
                return hours.map(hh => {
                  const key = `${dayHoursPicker}|${hh}`;
                  const active = selectedConfigKeys.has(key);
                  return (
                    <TouchableOpacity
                      key={key}
                      style={[styles.hourChip, active && styles.hourChipActive]}
                      onPress={() => setSelectedConfigKeys(prev => {
                        const n = new Set(prev);
                        if (n.has(key)) n.delete(key); else n.add(key);
                        return n;
                      })}
                      activeOpacity={0.85}
                    >
                      <Text style={[styles.hourChipText, active && styles.hourChipTextActive]}>{hh}</Text>
                    </TouchableOpacity>
                  );
                });
              })()}
            </ScrollView>
            <Text style={[styles.infoText, { marginTop: 8 }]}>
              {(() => {
                const hours = Array.from(selectedConfigKeys)
                  .filter(k => k.startsWith(`${dayHoursPicker}|`))
                  .map(k => k.split('|')[1])
                  .sort();
                if (hours.length === 0) return '0 horas seleccionadas';
                return `${hours.length} horas seleccionadas • ${hours[0]} - ${hours[hours.length-1]}`;
              })()}
            </Text>

            <TouchableOpacity style={[styles.confirmBtn, { marginTop: 16 }]} onPress={() => setDayHoursPicker(null)} activeOpacity={0.85}>
              <Text style={styles.confirmText}>Listo</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.lightGreen },
  content: { padding: 20, gap: 12 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  backText: { color: colors.dark, fontWeight: '700' },
  title: { fontSize: 22, fontWeight: '800', color: colors.dark },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 14, gap: 8, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6, borderBottomWidth: 1, borderBottomColor: '#E6F1E9', paddingBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: colors.dark },
  cardSubtitle: { fontSize: 12, color: colors.dark, opacity: 0.7 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoText: { color: colors.dark, fontWeight: '600' },
  horarioRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },
  horarioText: { color: colors.dark },
  horarioPrecio: { color: colors.green, fontWeight: '800' },
  totalCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  totalLabel: { color: colors.dark, fontWeight: '700' },
  totalValue: { color: colors.green, fontWeight: '800', fontSize: 18 },
  confirmBtn: { backgroundColor: colors.green, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingVertical: 14 },
  confirmText: { color: '#fff', fontWeight: '800' },
  modalOverlay: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: '#00000070', alignItems: 'center', justifyContent: 'center' },
  modalCard: { width: '88%', backgroundColor: '#fff', borderRadius: 16, padding: 16, gap: 10 },
  modalTitle: { fontWeight: '800', color: colors.dark, marginBottom: 6 },
  hourChip: { backgroundColor: '#E7F6EE', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  hourChipActive: { backgroundColor: colors.green },
  hourChipText: { fontWeight: '800', color: colors.dark },
  hourChipTextActive: { color: '#fff' },
});
