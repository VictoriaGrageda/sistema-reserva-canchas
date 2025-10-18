// screens/PostRegisterScreen.tsx
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
import { http } from "../api/http"; // si quieres quitar el ping, quítalo
import { useAuth } from "../context/AuthContext";

export default function PostRegisterScreen() {
  const { changeRole } = useAuth();
  const [loading, setLoading] = useState<"none" | "cliente" | "administrador">("none");

  const pickRole = async (rol: "cliente" | "administrador") => {
    try {
      setLoading(rol);

      // opcional: ver conectividad; elimina si molesta
      try { await http.get("/usuarios/ping"); } catch {}

      // 👇 MUY IMPORTANTE: NO navegas. Solo cambias el rol.
      await changeRole(rol);

      // ¡Listo! AppNavigator re-renderiza por el cambio en user.rol
      // y monta el stack correcto (Home / HomeGestor).
    } catch (err: any) {
      Alert.alert(
        "Error",
        err?.response?.data?.message ?? err?.message ?? "No se pudo actualizar el rol."
      );
      setLoading("none");
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      {/* héroe, no captura toques */}
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
  hero: { alignItems: "center", marginTop: 8, marginBottom: 28, zIndex: 0 },
  ballCircle: {
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: colors.yellow,
    alignItems: "center",
    justifyContent: "center",
    elevation: 0,
  },
  ball: { width: 220, height: 220 },
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
