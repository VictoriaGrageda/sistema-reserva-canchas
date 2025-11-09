import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import colors from '../theme/colors';

type Slot = { id: string; fecha: string; hora_inicio: string; hora_fin: string; precio: number };

export default function MonthGrid({
  slots,
  selected,
  onToggle,
}: {
  slots: Slot[];
  selected?: Set<string> | string[];
  onToggle?: (id: string) => void;
}) {
  const selectedSet: Set<string> = React.useMemo(() => {
    if (!selected) return new Set();
    return selected instanceof Set ? selected : new Set(selected);
  }, [selected]);

  const formatTime = (t: any) => {
    const s = String(t ?? '');
    if (s.includes('T') && s.length >= 16) return s.substring(11, 16);
    // Expect HH:MM or HH:MM:SS
    return s.substring(0, 5);
  };

  const byDate = new Map<string, Array<{ id: string; hora_inicio: string; hora_fin: string; precio: number }>>();
  slots.forEach((s) => {
    const d = new Date(s.fecha);
    const dateStr = d.toISOString().split('T')[0];
    const arr = byDate.get(dateStr) || [];
    arr.push({ id: s.id, hora_inicio: s.hora_inicio, hora_fin: s.hora_fin, precio: s.precio });
    byDate.set(dateStr, arr);
  });

  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const weeks: Array<Array<Date>> = [];
  const firstDayDow = (start.getDay() + 6) % 7; // 0=lunes
  let cursor = new Date(start);
  cursor.setDate(start.getDate() - firstDayDow);
  while (cursor <= end || (cursor.getDay() + 6) % 7 !== 0) {
    const week: Array<Date> = [];
    for (let i = 0; i < 7; i++) {
      week.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }

  const dayHeaders = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

  return (
    <View style={styles.monthGrid}>
      <View style={styles.monthHeaderRow}>
        {dayHeaders.map((h) => (
          <Text key={h} style={styles.monthHeaderCell}>{h}</Text>
        ))}
      </View>
      {weeks.map((week, wi) => (
        <View key={wi} style={styles.weekRow}>
          {week.map((day, di) => {
            const inMonth = day.getMonth() === start.getMonth();
            const dateStr = day.toISOString().split('T')[0];
            const items = byDate.get(dateStr) || [];
            return (
              <View key={di} style={[styles.dayCell, !inMonth && { opacity: 0.35 }]}> 
                <Text style={styles.dayNumber}>{day.getDate()}</Text>
                {items.length > 0 ? (
                  <View style={styles.timeChips}>
                    {items.map((it) => {
                      const isSelected = selectedSet.has(it.id);
                      return (
                        <TouchableOpacity
                          key={it.id}
                          style={[styles.timeChip, isSelected && styles.timeChipSelected]}
                          onPress={() => onToggle && onToggle(it.id)}
                          activeOpacity={0.8}
                        >
                          <Text style={[styles.timeChipText, isSelected && styles.timeChipTextSelected]}>
                            {formatTime(it.hora_inicio)}-{formatTime(it.hora_fin)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : (
                  <Text style={styles.noSlots}>-</Text>
                )}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  monthGrid: { gap: 6 },
  monthHeaderRow: { flexDirection: 'row', gap: 4, marginBottom: 4 },
  monthHeaderCell: { flex: 1, textAlign: 'center', fontWeight: '800', color: colors.dark },
  weekRow: { flexDirection: 'row', gap: 4 },
  dayCell: {
    flex: 1,
    minHeight: 70,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E6F1E9',
    padding: 6,
  },
  dayNumber: { fontSize: 12, fontWeight: '800', color: colors.dark, marginBottom: 4 },
  timeChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  timeChip: { backgroundColor: '#E7F6EE', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  timeChipSelected: { backgroundColor: colors.green },
  timeChipText: { fontSize: 11, fontWeight: '700', color: colors.dark },
  timeChipTextSelected: { color: '#fff' },
  noSlots: { fontSize: 12, color: '#999' },
});
