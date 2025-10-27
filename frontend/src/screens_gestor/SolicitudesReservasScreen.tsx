// src/screens_gestor/SolicitudesReservasScreen.tsx
import React from "react";
import { View, Text, StyleSheet, StatusBar } from "react-native";
import colors from "../theme/colors";
import Footer from "../components/FooterGestor";
import type { NavProps } from "../navigation/types";

export default function SolicitudesReservasScreen({ navigation }: NavProps<"SolicitudesReservas">) {
  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={colors.green} />
      <Footer onLogout={() => navigation.replace("Welcome")} />

      {/* Contenido base */}
      <View style={styles.content}>
        <Text style={styles.title}>Solicitudes de reservas</Text>
        <Text style={styles.subtitle}>Aquí verás las solicitudes pendientes</Text>

        
        <View style={styles.card}>
          <Text style={styles.cardText}>No hay solicitudes por ahora</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.lightGreen,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.dark,
  },
  subtitle: {
    opacity: 0.7,
    color: colors.dark,
  },
  card: {
    marginTop: 8,
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    alignItems: "center",
  },
  cardText: {
    color: colors.dark,
    fontWeight: "600",
  },
});
