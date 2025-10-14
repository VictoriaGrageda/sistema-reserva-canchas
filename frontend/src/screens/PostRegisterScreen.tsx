// screens/PostRegisterScreen.tsx PARA DEFINIR EL TIPO DE ROL QUE SE TENDRA : FALTA BACKEND
import React from "react";
import { SafeAreaView, View, Text, Image, TouchableOpacity, StyleSheet, StatusBar, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import colors from "../theme/colors";
import ball from "../../assets/images/ball.png";

type Props = NativeStackScreenProps<any, "PostRegister">;

export default function PostRegisterScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.screen}>
    

      {/* Balón centrado con halo */}
      <View style={styles.hero}>
        <View style={styles.ballCircle}>
          <Image source={ball} style={styles.ball} resizeMode="contain" />
        </View>
      </View>

      {/* Bloque 1: Ir a Home */}
      <View style={styles.row}>
            <Text style={styles.rowText}>
            ERES DEPORTISTA Y{"\n"}¿QUIERES BUSCAR{"\n"}CANCHA/s PARA JUGAR CON AMIGOS ?
            </Text>
            <TouchableOpacity
            style={[styles.cta, styles.ctaRed]}
            activeOpacity={0.85}
            onPress={() => navigation.replace("Home")}
            >
            <Text style={styles.ctaTextLight}>Presiona aquí</Text>
            </TouchableOpacity>
      </View>

      {/* Bloque 2: flujo para ofrecer canchas (ajustaR ruta cuando se la tenga ) */}
      <View style={[styles.row, { marginTop: 28 }]}>
        <Text style={styles.rowText}>
          ¿QUIERES OFRECER TUS{"\n"}CANCHAS O POLIDEPORTIVOS?
        </Text>
        <TouchableOpacity
          style={[styles.cta, styles.ctaYellow]}
          activeOpacity={0.85}
          onPress={() => navigation.replace("HomeGestor")}
        >
          <Text style={styles.ctaTextDark}>Presiona aquí</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.green,
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
 
  hero: {
    alignItems: "center",
    marginTop: 8,
    marginBottom: 28,
  },
  ballCircle: {
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: colors.yellow,
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: colors.dark,
    shadowOpacity: 0.25,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
  },
  ball: { width: 220, height: 220 },

  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  rowText: {
    flex: 1,
    color: colors.white,
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22,
  },
  cta: {
    width: 140,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    shadowColor: colors.dark,
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  ctaRed: {
    backgroundColor: colors.red ?? "#D63D3D",
    borderWidth: 2,
    borderColor: "#242424",
  },
  ctaYellow: {
    backgroundColor: colors.accent,
    borderWidth: 2,
    borderColor: "#242424",
  },
  ctaTextLight: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "800",
  },
  ctaTextDark: {
    color: "#1B1B1B",
    fontSize: 14,
    fontWeight: "800",
  },
});
