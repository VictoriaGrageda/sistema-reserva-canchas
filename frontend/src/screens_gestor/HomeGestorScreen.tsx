import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Platform } from 'react-native';
import colors from '../theme/colors';
import type { NavProps } from '../navigation/types';
import Footer from "../components/FooterGestor";

export default function HomeGestorScreen({ navigation }: NavProps<'HomeGestor'>) {
  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={colors.green} />
      
      <Footer />

      {/* Contenido centrado debajo del header */}
      <View style={styles.content}>
        <View style={styles.panel}>

          <TouchableOpacity
            style={[styles.action, styles.actionPrimary]}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('RegistroCanchas')}
          >
            <Text style={styles.actionTitleLight}>Registrar Cancha</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.action, styles.actionFourth]}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('RegistroComplejoDeportivo')}
          >
            <Text style={styles.actionTitleLight}>Registrar Complejo Deportivo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.action, styles.actionSecondary]}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('CanchasRegistradas')}
          >
            <Text style={styles.actionTitleDark}>Mis Canchas</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.action, styles.actionTerth]}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('SolicitudesReservas')}
          >
            <Text style={styles.actionTitleDark}>Solicitud de reservas </Text>
          </TouchableOpacity>

        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Fondo de la pantalla
  screen: {
    flex: 1,
    backgroundColor: colors.lightGreen,
  },

  // Zona que centra el panel
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },

  // Panel blanco mejorado
  panel: {
    height: 400,
    width: 300,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    gap:30 ,
    justifyContent: 'center',

    // Sombra cross-platform
    elevation: 6, // Android
    shadowColor: colors.dark, // iOS
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },

  // Botones
  action: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    borderRadius: 18,
    paddingVertical: 18,

  
  },
  actionPrimary: {
    backgroundColor: colors.red, // rojo de tu theme
  },
  actionSecondary: {
    backgroundColor: '#1cc616ff',
  },
  actionTerth: {
    backgroundColor: colors.accent,
  },
  actionFourth: {
    backgroundColor: '#4a02f4ff',
  },

  // Tipografías
  actionTitleLight: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.white,
  },
  actionTitleDark: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.dark,
  },
});
