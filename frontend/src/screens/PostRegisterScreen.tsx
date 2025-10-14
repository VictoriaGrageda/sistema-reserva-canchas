import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Pressable,
} from "react-native";
import colors from "../theme/colors";
import ball from "../../assets/images/ball.png";
import { http } from "../api/http"; // para ping directo; puedes quitarlo luego
import { useAuth } from "../context/AuthContext";

export default function PostRegisterScreen({ navigation }: any) {
  const { changeRole } = useAuth();
  const [loading, setLoading] = useState<"none" | "cliente" | "administrador">("none");

  const pickRole = async (rol: "cliente" | "administrador") => {
    try {
      setLoading(rol);

      // --- Depuración: verifica conectividad directa (quítalo si ya te funciona)
      await http.get("/usuarios/ping");

      await changeRole(rol); // PATCH + refresh
      navigation.replace(rol === "administrador" ? "HomeGestor" : "Home");
    } catch (err: any) {
      Alert.alert(
        "Error",
        err?.response?.data?.message ??
          err?.message ??
          "No se pudo actualizar el rol."
      );
    } finally {
      setLoading("none");
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      {/* IMPORTANTE: evita que el héroe capture toques */}
      <View style={styles.hero} pointerEvents="none">
        <View style={styles.ballCircle}>
          <Image source={ball} style={styles.ball} resizeMode="contain" />
        </View>
      </View>

      {/* Cliente */}
      <View style={styles.row}>
        <Text style={styles.rowText}>
          ERES DEPORTISTA Y{"\n"}¿QUIERES BUSCAR{"\n"}CANCHA/S PARA JUGAR CON AMIGOS?
        </Text>

        <Pressable
          style={({ pressed }) => [
            styles.cta,
            styles.ctaRed,
            pressed || loading !== "none" ? { opacity: 0.7 } : null,
          ]}
          disabled={loading !== "none"}
          onPressIn={() => console.log("pressIn cliente")}
          onPress={() => pickRole("cliente")}
        >
          {loading === "cliente" ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.ctaTextLight}>Presiona aquí</Text>
          )}
        </Pressable>
      </View>

      {/* Administrador */}
      <View style={[styles.row, { marginTop: 28 }]}>
        <Text style={styles.rowText}>
          ¿QUIERES OFRECER TUS{"\n"}CANCHAS O POLIDEPORTIVOS?
        </Text>

        <Pressable
          style={({ pressed }) => [
            styles.cta,
            styles.ctaYellow,
            pressed || loading !== "none" ? { opacity: 0.7 } : null,
          ]}
          disabled={loading !== "none"}
          onPressIn={() => console.log("pressIn admin")}
          onPress={() => pickRole("administrador")}
        >
          {loading === "administrador" ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.ctaTextDark}>Presiona aquí</Text>
          )}
        </Pressable>
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

  // Asegura que el héroe no tape nada
  hero: {
    alignItems: "center",
    marginTop: 8,
    marginBottom: 28,
    zIndex: 0, // debajo
  },
  ballCircle: {
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: colors.yellow,
    alignItems: "center",
    justifyContent: "center",
    // evita stacking agresivo en Android
    elevation: 0,
  },
  ball: { width: 220, height: 220 },

  // Botones por encima del héroe
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 10,
  },
  rowText: {
    flex: 1,
    color: colors.white,
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22,
    marginRight: 12,
  },

  cta: {
    width: 160,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaRed: { backgroundColor: colors.red ?? "#D63D3D", borderWidth: 2, borderColor: "#242424" },
  ctaYellow: { backgroundColor: colors.accent, borderWidth: 2, borderColor: "#242424" },
  ctaTextLight: { color: colors.white, fontSize: 14, fontWeight: "800" },
  ctaTextDark: { color: "#1B1B1B", fontSize: 14, fontWeight: "800" },
});
