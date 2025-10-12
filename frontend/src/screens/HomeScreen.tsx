import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import colors from '../theme/colors';
import type { NavProps } from '../navigation/types';
import Footer from "../components/Footer";
export default function HomeScreen({ navigation }: NavProps<'Home'>) {
  return (
    <View style={styles.container}>
      <Footer onLogout={() => navigation.replace('Welcome')} />  

      <View style={styles.panel}>
        <TouchableOpacity style={[styles.action, { backgroundColor: colors.red }]} onPress={() => { /* navegar a reservar */ }}>
          <Text style={styles.actionTitle}>Reservar Cancha</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.action, { backgroundColor: '#51e91fff' }]} onPress={() => { /* navegar a mis reservas */ }}>
          <Text style={styles.actionTitle}>Mis reservas</Text>
        </TouchableOpacity>

        
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.lightGreen, padding: 20 },

  panel: { flex: 1, backgroundColor: colors.mint, marginTop: 24, borderRadius: 16, padding: 20, gap: 16, justifyContent: 'center' },
  action: { borderWidth: 2, borderRadius: 16, paddingVertical: 22, alignItems: 'center' },
  actionTitle: { fontSize: 16, fontWeight: '800', color: colors.dark },
  logout: { marginTop: 12, backgroundColor: colors.red, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
});
