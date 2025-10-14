import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  SafeAreaView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import colors from "../theme/colors";

type Props = {
  onLogout?: () => void;
};

export default function Footer({onLogout}: Props) {
  const [open, setOpen] = useState(false);
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const goHome = () => {
    setOpen(false);
    navigation.replace("Home");
  };
  return (
    <>
      <SafeAreaView style={styles.safe}>
        <View style={styles.footer}>
          {/* Marca / Logo (puedes cambiar por Image si tienes asset) */}
          <Text style={styles.brand}>
            <Text style={styles.brandPart1}>F</Text>
            <Text style={styles.brandPart2}>ast</Text>
            <Text style={styles.brandPart3}>F</Text>
            <Text style={styles.brandPart4}>ut</Text>
          </Text>

          {/* Botón usuario */}
          <Pressable
            onPress={() => setOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Abrir menú de usuario"
            hitSlop={10}
            style={styles.userBtn}
          >
            <View style={styles.userCircle}>
              <Ionicons name="person-outline" size={28} color="#000000" />
            </View>
          </Pressable>
        </View>
      </SafeAreaView>

      {/* Menú modal */}
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
        <View style={styles.menuCard}>
       

          <Pressable
            style={[styles.menuItem, { backgroundColor: "#FAD4D8" }]}
            onPress={goHome}
          >
            <Text style={styles.menuText}>INICIO</Text>
          </Pressable>

          <Pressable
            style={[styles.menuItem, { backgroundColor: "#D6EDF1" }]}
            onPress={() => navigation.navigate('HistorialReservas')}
          >
            <Text style={styles.menuText}>HISTORIAL DE RESERVAS</Text>
          </Pressable>

          <Pressable
            style={[styles.menuItem, { backgroundColor: "#E6F6E6" }]}
            onPress={() => navigation.navigate('Configuraciones')}
          >
            <Text style={styles.menuText}>CONFIGURACIONES</Text>
          </Pressable>

          <Pressable
            style={[styles.menuItem, { backgroundColor: "#EEDAF0" }]}
            onPress={() => {
                setOpen(false);
                onLogout?.();
              }}
            
          >
            <Text style={styles.menuText}>CERRAR SESIÓN</Text>
          </Pressable>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: colors.green,
  },
  footer: {
    height: 200,
    width: '100%',
    backgroundColor: colors.green,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    borderTopWidth: Platform.OS === "ios" ? StyleSheet.hairlineWidth : 0,
    borderTopColor: "#00000020",
  },

  // Marca estilo aproximado al mock
  brand: { fontSize: 40, fontWeight: "800", letterSpacing: 1 },
  brandPart1: { color: "#7C0F0F" },  // rojo oscuro tipo pincel
  brandPart2: { color: "#7C0F0F" },
  brandPart3: { color: colors.yellow },  // amarillo del mock
  brandPart4: { color: colors.yellow },

  userBtn: { padding: 6 },
  userCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },

  // Modal
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#00000070",
  },
  menuCard: {
    position: "absolute",
    right: 20,
    bottom: 220, // aparece encima del footer
    width: 280,
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 16,
    gap: 12,
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
  },
  
  menuItem: {
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  menuText: {
    color: "#1B1B1B",
    fontSize: 14,
    fontWeight: "700",
  },
});
