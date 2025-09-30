import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import colors from '../theme/colors';
import type { NavProps } from '../navigation/types';

export default function HomeScreen({ navigation }: NavProps<'Home'>) {
  return (
    <View style={styles.container}>
      <Text style={styles.brand}>FastFut</Text>

      <View style={styles.panel}>
        <TouchableOpacity style={[styles.action, { borderColor: colors.accent }]} onPress={() => { /* navegar a reservar */ }}>
          <Text style={styles.actionTitle}>Reservar Cancha</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.action, { borderColor: '#0E7940' }]} onPress={() => { /* navegar a mis reservas */ }}>
          <Text style={styles.actionTitle}>Mis reservas</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logout} onPress={() => navigation.replace('Welcome')}>
          <Text style={{ color: colors.white, fontWeight: '700' }}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#127148', padding: 20 },
  brand: { color: colors.accent, fontSize: 28, fontWeight: '900', marginTop: 24 },
  panel: { flex: 1, backgroundColor: colors.mint, marginTop: 24, borderRadius: 16, padding: 20, gap: 16, justifyContent: 'center' },
  action: { borderWidth: 2, borderRadius: 16, paddingVertical: 22, alignItems: 'center' },
  actionTitle: { fontSize: 16, fontWeight: '800', color: colors.dark },
  logout: { marginTop: 12, backgroundColor: colors.red, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
});
