// src/screens_gestor/CanchasRegistradasScreen.tsx
import React from "react";
import { View, Text, StyleSheet, StatusBar } from "react-native";
import colors from "../theme/colors";
import Footer from "../components/FooterGestor";
import type { NavProps } from "../navigation/types";

export default function CanchasRegistradasScreen({ navigation }: NavProps<"CanchasRegistradas">) {
  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={colors.green} />
      <Footer onLogout={() => navigation.replace("Welcome")} />

      
      <View style={styles.content}>
        <Text style={styles.placeholder}>Canchas registradas</Text>
        <Text style={styles.subtitle}>Aquí verás la lista de tus canchas</Text>
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
