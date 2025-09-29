import { ImageBackground, StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import colors from '../theme/colors';
import type { NavProps } from '../navigation/types';

export default function WelcomeScreen({ navigation }: NavProps<'Welcome'>) {
  return (
    <ImageBackground
      source={require('../../assets/images/bg-grass.jpg')}
      style={styles.bg}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <Text style={styles.title}>
          Bienvenido a <Text style={{ color: colors.accent }}>FastFut</Text>
        </Text>
        <Text style={styles.subtitle}>Tu cancha, tu hora, en un solo click</Text>

        <TouchableOpacity style={[styles.btn, { backgroundColor: colors.accent }]} onPress={() => navigation.navigate('Register')}>
          <Text style={styles.btnText}>Registrarse</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, { backgroundColor: '#5964E0' }]} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.btnText}>Ingresar</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: 'rgba(0,0,0,0.25)' },
  title: { fontSize: 28, fontWeight: '800', color: colors.white, textAlign: 'center' },
  subtitle: { marginTop: 6, color: colors.white, opacity: 0.9, textAlign: 'center' },
  btn: { width: '80%', paddingVertical: 12, borderRadius: 12, marginTop: 12, alignItems: 'center' },
  btnText: { color: 'white', fontWeight: '700', fontSize: 16 },
});
