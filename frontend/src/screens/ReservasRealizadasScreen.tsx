import React from "react";
import { View, Text, StyleSheet, StatusBar } from "react-native";
import colors from "../theme/colors";
import Footer from "../components/Footer";
import type { NavProps } from "../navigation/types";

export default function ReservasRealizadasScreen({ navigation }: NavProps<"ReservasRealizadas">) {
  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={colors.green} />
      <Footer onLogout={() => navigation.replace("Welcome")} />

      
      <View style={styles.content}>
        <Text style={styles.placeholder}>Espacio para ver Reservas Realizadas de canchas pendientes a confirmacion de reserva y aceptadas</Text>
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
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  placeholder: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.dark,
  },
  subtitle: {
    marginTop: 6,
    opacity: 0.7,
    color: colors.dark,
  },
});
