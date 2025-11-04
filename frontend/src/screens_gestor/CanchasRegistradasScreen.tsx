// src/screens_gestor/CanchasRegistradasScreen.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import colors from "../theme/colors";
import Footer from "../components/FooterGestor";
import type { NavProps } from "../navigation/types";
import { CanchasAPI } from "../api/canchas";

interface Cancha {
  id: string;
  nombre: string;
  tipoCancha: string;
  complejo?: {
    id: string;
    nombre: string;
  } | null;
}

export default function CanchasRegistradasScreen({ navigation }: NavProps<"CanchasRegistradas">) {
  const [canchas, setCanchas] = useState<Cancha[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const cargarCanchas = async () => {
    try {
      const data = await CanchasAPI.listar();
      setCanchas(data);
    } catch (error: any) {
      console.error("Error al cargar canchas:", error);
      Alert.alert("Error", "No se pudieron cargar las canchas.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    cargarCanchas();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    cargarCanchas();
  };

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      FUT5: "Fútbol 5",
      FUT6: "Fútbol 6",
      FUT8: "Fútbol 8",
      FUT11: "Fútbol 11",
    };
    return labels[tipo] || tipo;
  };

  if (loading) {
    return (
      <View style={styles.screen}>
        <StatusBar barStyle="light-content" backgroundColor={colors.green} />
        <Footer />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.green} />
          <Text style={styles.loadingText}>Cargando canchas...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={colors.green} />
      <Footer />

      <View style={styles.header}>
        <Text style={styles.title}>Mis Canchas</Text>
        <Text style={styles.subtitle}>
          {canchas.length} {canchas.length === 1 ? "cancha registrada" : "canchas registradas"}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.green]} />
        }
      >
        {canchas.length > 0 ? (
          canchas.map((cancha) => (
            <TouchableOpacity
              key={cancha.id}
              style={styles.card}
              activeOpacity={0.7}
              onPress={() => {
                navigation.navigate("EditarCancha", { cancha_id: cancha.id });
              }}
            >
              <View style={styles.cardHeader}>
                <View style={styles.iconContainer}>
                  <Ionicons name="football" size={24} color={colors.green} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{cancha.nombre}</Text>
                  <Text style={styles.cardSubtitle}>{getTipoLabel(cancha.tipoCancha)}</Text>
                  {cancha.complejo && (
                    <View style={styles.complejoTag}>
                      <Ionicons name="business-outline" size={12} color={colors.dark} />
                      <Text style={styles.complejoText}>{cancha.complejo.nombre}</Text>
                    </View>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={20} color="#CCC" />
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="football-outline" size={64} color="#CCC" />
            <Text style={styles.placeholder}>No hay canchas registradas</Text>
            <Text style={styles.emptySubtext}>
              Registra tu primera cancha para comenzar a recibir reservas
            </Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate("RegistroCanchas")}
              activeOpacity={0.85}
            >
              <Ionicons name="add-circle-outline" size={20} color="#fff" />
              <Text style={styles.addButtonText}>Registrar Cancha</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.lightGreen,
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  loadingText: {
    fontSize: 14,
    color: colors.dark,
    opacity: 0.7,
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    backgroundColor: "#fff",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },

  title: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.dark,
  },
  subtitle: {
    fontSize: 13,
    color: colors.dark,
    opacity: 0.7,
    marginTop: 4,
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 12,
  },

  // Card de cancha
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#E7F6EE",
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.dark,
  },
  cardSubtitle: {
    fontSize: 13,
    color: colors.dark,
    opacity: 0.6,
    marginTop: 2,
  },
  complejoTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: "#F0F0F0",
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  complejoText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.dark,
    opacity: 0.7,
  },

  // Empty state
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 10,
  },
  placeholder: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.dark,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.dark,
    opacity: 0.6,
    textAlign: "center",
    marginTop: 4,
    paddingHorizontal: 40,
  },
  addButton: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: colors.green,
    borderRadius: 999,
    elevation: 2,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },
});
