import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import colors from '../theme/colors';

type Config = { dia_semana: string; hora_inicio: string; hora_fin: string };

export default function WeeklyRepeatGrid({
  config,
  weeks,
  onToggleWeek,
  selectedCounts,
  selectedSummary,
  onOpenDay,
  weekRanges,
}: {
  config: Config[];
  weeks: boolean[]; // length 4
  onToggleWeek: (idx: number) => void;
  selectedCounts?: Record<string, number>; // { LUNES: 3, ... }
  selectedSummary?: Record<string, string>; // { LUNES: "06:00 - 12:00" }
  onOpenDay?: (day: string) => void;
  weekRanges?: Array<{ start: string; end: string }>;
}) {
  const daysOrder = ['LUNES','MARTES','MIERCOLES','JUEVES','VIERNES','SABADO','DOMINGO'];
  const timeForDay = React.useMemo(() => {
    const map = new Map<string, Array<string>>();
    daysOrder.forEach(d => map.set(d, []));
    const toMin = (hhmm: string) => {
      const [h,m] = hhmm.split(':').map(Number);
      return h*60 + (m || 0);
    };
    const toStr = (mins: number) => {
      const h = Math.floor(mins/60)%24; const m = mins%60;
      return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
    };
    const setMap = new Map<string, Set<string>>();
    daysOrder.forEach(d => setMap.set(d, new Set()));
    config.forEach(c => {
      const key = String(c.dia_semana).toUpperCase();
      const set = setMap.get(key) as Set<string>;
      const start = toMin(c.hora_inicio);
      const end = toMin(c.hora_fin);
      for (let t = start; t < end; t += 60) { // slots de 60 min
        set.add(toStr(t));
      }
    });
    daysOrder.forEach(d => {
      const arr = Array.from(setMap.get(d) as Set<string>).sort();
      map.set(d, arr);
    });
    return map;
  }, [config]);

  return (
    <View style={{ gap: 12 }}>
      <View style={styles.weeksCol}>
        {[0,1,2,3].map((i) => (
          <TouchableOpacity
            key={i}
            style={[styles.weekItem, weeks[i] && styles.weekItemActive]}
            onPress={() => onToggleWeek(i)}
            activeOpacity={0.85}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.weekItemText, weeks[i] && styles.weekItemTextActive]}>Semana {i+1}</Text>
              {weekRanges?.[i] && (
                <Text style={[styles.weekRangeText, weeks[i] && styles.weekItemTextActive]}>
                  {weekRanges[i].start} — {weekRanges[i].end}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.daysGrid}>
        {daysOrder.map((day) => {
          const total = (timeForDay.get(day) || []).length;
          const selected = selectedCounts?.[day] ?? total;
          return (
            <TouchableOpacity
              key={day}
              style={styles.dayCol}
              onPress={() => onOpenDay && onOpenDay(day)}
              activeOpacity={0.85}
            >
              <Text style={styles.dayTitle}>{day[0] + day.slice(1).toLowerCase()}</Text>
              {total > 0 ? (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryText}>
                    {selectedSummary?.[day] ? selectedSummary[day] : `${selected} / ${total} horas seleccionadas`}
                  </Text>
                </View>
              ) : (
                <Text style={styles.noTimes}>Sin horarios</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  weeksCol: { gap: 8 },
  weekItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E6F1E9',
  },
  weekItemActive: { backgroundColor: colors.green, borderColor: colors.green },
  weekItemText: { color: colors.dark, fontWeight: '800' },
  weekItemTextActive: { color: '#fff' },
  weekRangeText: { color: colors.dark, opacity: 0.7, fontSize: 12 },

  daysGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dayCol: { width: '48%', backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#E6F1E9', padding: 10 },
  dayTitle: { fontWeight: '800', color: colors.dark, marginBottom: 6 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  summaryText: { fontWeight: '700', color: colors.dark },
  summaryHint: { color: colors.dark, opacity: 0.6, fontSize: 12 },
  noTimes: { color: '#999' },
});
