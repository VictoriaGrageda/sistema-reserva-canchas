import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Modal,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import colors from "../theme/colors";
import Footer from "../components/Footer";
import type { NavProps } from "../navigation/types";

const precios = ["10 Bs", "20 Bs", "30 Bs", "40 Bs", "50 Bs", "60 Bs", "70 Bs", "80 Bs"];
const tiposCampo = ["Fútbol 5", "Fútbol 6", "Fútbol 8", "Fútbol 11"];
const tiposCancha = ["Césped sintetico", "Tierra Batida", "Césped natural"];
const tiposReservas = ["Complejo deportivo", "Cancha Individual"];

export default function ReservarCanchasScreen({ navigation }: NavProps<"ReservarCanchas">) {
  const [campo, setCampo] = useState<string | null>(null);
  const [cancha, setCancha] = useState<string | null>(null);
  const [precio, setPrecio] = useState<string | null>(null);

  // modal select genérico
  const [selectOpen, setSelectOpen] = useState<null | {
    title: string;
    options: string[];
    onPick: (v: string) => void;
  }>(null);

  const openSelect = (title: string, options: string[], onPick: (v: string) => void) =>
    setSelectOpen({ title, options, onPick });

  const pickOption = (v: string) => {
    if (!selectOpen) return;
    selectOpen.onPick(v);
    setSelectOpen(null);
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={colors.green} />
      <Footer onLogout={() => navigation.replace("Welcome")} />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Filtros para escoger que reservar si complejos deportivo con n canchas o una sola cancha */}
        <View style={styles.filters}>

          <Labeled label="¿Qué deseas buscar?">
            <SelectField
              value={campo}
              placeholder="Seleccione tipo de reservar"
              onPress={() => openSelect("Tipo de reservas", tiposReservas, setCampo)}
            />
          </Labeled>

          <Labeled label="Tipo de campo deportivo">
            <SelectField
              value={campo}
              placeholder="Seleccione el tipo de campo/s deportivo/s"
              onPress={() => openSelect("Tipo de campo deportivo", tiposCampo, setCampo)}
            />
          </Labeled>

          <Labeled label="Tipo de cancha deportiva">
            <SelectField
              value={cancha}
              placeholder="Seleccione tipo de cancha/s deportivas"
              onPress={() => openSelect("Tipo de cancha deportiva", tiposCancha, setCancha)}
            />
          </Labeled>

          <Labeled label="Precio bs/hr">
            <SelectField
              value={precio}
              placeholder="Seleccione precio"
              onPress={() => openSelect("Precio bs/hr", precios, setPrecio)}
            />
          </Labeled>

          <TouchableOpacity style={styles.searchBtn} activeOpacity={0.85}>
            <Text style={styles.searchText}>BUSCAR</Text>
          </TouchableOpacity>
        </View>

        {/* Card blanco para “mapa” (placeholder) */}
        <View style={styles.mapCard}>
          <Text style={styles.mapPlaceholder}>Aquí irá el mapa / resultados del mapa</Text>
        </View>
      </ScrollView>

      {/* Modal genérico de selección */}
      <Modal visible={!!selectOpen} transparent animationType="fade" onRequestClose={() => setSelectOpen(null)}>
        <Pressable style={styles.backdrop} onPress={() => setSelectOpen(null)} />
        <View style={styles.selectModalCard}>
          <Text style={styles.modalTitle}>{selectOpen?.title}</Text>
          <ScrollView style={{ maxHeight: 320 }}>
            {selectOpen?.options.map((opt) => (
              <TouchableOpacity key={opt} style={styles.optionRow} onPress={() => pickOption(opt)}>
                <Text style={styles.optionText}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

/* ---------- UI helpers ---------- */

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

function SelectField({
  value,
  placeholder,
  onPress,
}: {
  value: string | null;
  placeholder: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.select} onPress={onPress} activeOpacity={0.9}>
      <Text style={[styles.selectText, !value && { color: "#9AA1A5" }]}>
        {value ?? placeholder}
      </Text>
      <Ionicons name="chevron-down" size={18} color="#1B1B1B" />
    </TouchableOpacity>
  );
}

/* ---------- styles ---------- */

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.lightGreen,
  },
  content: {
    paddingTop:20,
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 14,
  },

  // filtros
  filters: {
    marginTop: 10,
    gap: 12,
  },
  label: {
    color: colors.dark,
    fontSize: 13,
    fontWeight: "700",
    opacity: 0.9,
    marginLeft: 2,
  },
  select: {
    height: 40,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1.5,
    borderColor: "#E6F1E9",
    elevation: 1,
  },
  selectText: {
    color: colors.dark,
    fontSize: 14,
    fontWeight: "600",
  },
  searchBtn: {
    alignSelf: "center",
    marginTop: 2,
    height: 40,
    paddingHorizontal: 28,
    backgroundColor: "#17D650",
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
  },
  searchText: {
    color: "#fff",
    fontWeight: "800",
    letterSpacing: 0.3,
  },

  // card blanco para mapa (90% de pantalla a lo ancho)
  mapCard: {
    alignSelf: "center",
    width: "90%",
    height: 360,          // ajusta el alto si deseas
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginTop: 8,
    padding: 10,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    alignItems: "center",
    justifyContent: "center",
  },
  mapPlaceholder: {
    color: colors.dark,
    opacity: 0.7,
    fontWeight: "600",
  },

  // modal select
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#00000070",
  },
  selectModalCard: {
    position: "absolute",
    left: 20,
    right: 20,
    top: "22%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
  },
  modalTitle: {
    fontWeight: "800",
    fontSize: 16,
    color: colors.dark,
    marginBottom: 8,
  },
  optionRow: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E9ECEF",
  },
  optionText: {
    fontSize: 14,
    color: colors.dark,
  },
});
