import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../theme/colors';
import Footer from '../components/Footer';
import type { NavProps } from '../navigation/types';

export default function TipoReservaScreen({ navigation, route }: NavProps<'TipoReserva'>) {
  const { cancha, complejo } = route.params;

  const go = (tipo: 'diaria' | 'mensual') => {
    if (tipo === 'mensual') {
      navigation.replace('ConfirmarReserva', {
        cancha,
        complejo,
        horarios: [],
        tipoReserva: 'mensual',
      });
    } else {
      navigation.replace('ReservarCanchas', {
        cancha,
        complejo,
        tipoReserva: 'diaria',
      });
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={colors.green} />
      <Footer />

      <View style={styles.content}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={colors.dark} />
          <Text style={styles.backText}>Volver</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Elige tipo de reserva</Text>
        <Text style={styles.subtitle}>
          {complejo ? `${complejo.nombre} • ${cancha.nombre}` : cancha.nombre}
        </Text>

        <TouchableOpacity style={[styles.choice, styles.choicePrimary]} onPress={() => go('diaria')} activeOpacity={0.85}>
          <Ionicons name="calendar" size={24} color="#fff" />
          <View style={{ flex: 1 }}>
            <Text style={styles.choiceTitlePrimary}>Reserva Normal</Text>
            <Text style={styles.choiceDescPrimary}>Elige una fecha y horarios específicos</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.choice} onPress={() => go('mensual')} activeOpacity={0.85}>
          <Ionicons name="calendar-outline" size={24} color={colors.dark} />
          <View style={{ flex: 1 }}>
            <Text style={styles.choiceTitle}>Reserva Mensual</Text>
            <Text style={styles.choiceDesc}>Bloquea días y horas durante todo el mes con un solo pago</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.dark} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.lightGreen },
  content: { padding: 20, gap: 12 },
  backBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 12,
    backgroundColor: '#fff', borderRadius: 20,
  },
  backText: { color: colors.dark, fontWeight: '700', fontSize: 14 },
  title: { fontSize: 22, fontWeight: '800', color: colors.dark, marginTop: 8 },
  subtitle: { fontSize: 13, color: colors.dark, opacity: 0.7, marginBottom: 6 },
  choice: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: '#E6F1E9',
  },
  choicePrimary: { backgroundColor: colors.green, borderColor: colors.green },
  choiceTitle: { fontSize: 16, fontWeight: '800', color: colors.dark },
  choiceDesc: { fontSize: 12, color: colors.dark, opacity: 0.7, marginTop: 2 },
  choiceTitlePrimary: { fontSize: 16, fontWeight: '800', color: '#fff' },
  choiceDescPrimary: { fontSize: 12, color: '#fff', opacity: 0.9, marginTop: 2 },
});
