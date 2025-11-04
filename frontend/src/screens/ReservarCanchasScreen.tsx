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
  Alert,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import colors from "../theme/colors";
import Footer from "../components/Footer";
import type { NavProps } from "../navigation/types";
import { ComplejosAPI } from "../api/complejos";
import { CanchasAPI } from "../api/canchas";
import { ReservasAPI } from "../api/reservas";

type Complejo = {
  id: string;
  nombre: string;
  ciudad?: string;
  direccion?: string;
  precioDiurnoPorHora: number;
  precioNocturnoPorHora: number;
};

type CanchaIndividual = {
  id: string;
  nombre: string;
  tipoCancha: string;
  tipoCampo: string;
  ciudad?: string;
  direccion?: string;
  precioDiurnoPorHora: number;
  precioNocturnoPorHora: number;
  admin?: {
    id: string;
    nombre: string;
  };
};

type Cancha = {
  id: string;
  nombre: string;
  tipoCancha: string;
  tipoCampo: string;
};

type Horario = {
  id: string;
  horaIni: string;
  horaFin: string;
  tipo: 'DIURNO' | 'NOCTURNO';
  precioBs: number;
};

export default function ReservarCanchasScreen({ navigation }: NavProps<"ReservarCanchas">) {
  const [ciudad, setCiudad] = useState("");
  const [loading, setLoading] = useState(false);

  // Resultados de búsqueda
  const [complejos, setComplejos] = useState<Complejo[]>([]);
  const [canchasIndividuales, setCanchasIndividuales] = useState<CanchaIndividual[]>([]);

  // Estado de selección (para complejos)
  const [complejoSeleccionado, setComplejoSeleccionado] = useState<Complejo | null>(null);
  const [canchas, setCanchas] = useState<Cancha[]>([]);

  // Estado de selección (para canchas individuales o de complejo)
  const [canchaSeleccionada, setCanchaSeleccionada] = useState<Cancha | CanchaIndividual | null>(null);

  // Fecha mínima: mañana (24 horas después)
  const getFechaMinima = () => {
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    return manana.toISOString().split("T")[0];
  };

  const [fecha, setFecha] = useState(() => getFechaMinima());
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [horariosSeleccionados, setHorariosSeleccionados] = useState<Set<string>>(new Set());

  const buscar = async () => {
    setLoading(true);
    try {
      // Parámetros de búsqueda
      const params = ciudad.trim()
        ? { ciudad: ciudad.trim(), nombre: ciudad.trim() }
        : {};

      // Buscar tanto complejos como canchas individuales en paralelo
      const [complejosData, canchasData] = await Promise.all([
        ComplejosAPI.buscar(params),
        CanchasAPI.listarIndividuales(params),
      ]);

      setComplejos(complejosData);
      setCanchasIndividuales(canchasData);

      if (complejosData.length === 0 && canchasData.length === 0) {
        Alert.alert("Sin resultados", "No se encontraron complejos ni canchas individuales.");
      }
    } catch (error: any) {
      console.error("Error al buscar:", error);
      Alert.alert("Error", "No se pudo realizar la búsqueda.");
    } finally {
      setLoading(false);
    }
  };

  const seleccionarComplejo = async (complejo: Complejo) => {
    setComplejoSeleccionado(complejo);
    setCanchaSeleccionada(null);
    setHorarios([]);
    setHorariosSeleccionados(new Set());

    setLoading(true);
    try {
      const canchasData = await CanchasAPI.listarPorComplejo(complejo.id);
      setCanchas(canchasData);
    } catch (error: any) {
      console.error("Error al listar canchas:", error);
      Alert.alert("Error", "No se pudieron cargar las canchas.");
    } finally {
      setLoading(false);
    }
  };

  const seleccionarCancha = async (cancha: Cancha | CanchaIndividual) => {
    setCanchaSeleccionada(cancha);
    setHorarios([]);
    setHorariosSeleccionados(new Set());

    setLoading(true);
    try {
      console.log("🔍 Buscando horarios para:", {
        cancha_id: cancha.id,
        cancha_nombre: cancha.nombre,
        fecha: fecha,
      });

      const response = await CanchasAPI.disponibilidad(cancha.id, fecha);
      console.log("📦 Respuesta del backend:", response);

      // El backend devuelve { cancha_id, fecha, slots: [...] }
      const horariosData = response.slots || response || [];
      console.log("⏰ Horarios disponibles:", horariosData);

      setHorarios(horariosData);

      if (horariosData.length === 0) {
        Alert.alert(
          "Sin horarios",
          "No hay horarios disponibles para esta cancha en la fecha seleccionada. Puede que no se hayan configurado horarios o ya estén todos reservados."
        );
      }
    } catch (error: any) {
      console.error("❌ Error al obtener horarios:", error);
      console.error("Detalles:", error.response?.data);
      Alert.alert(
        "Error",
        error.response?.data?.message || "No se pudieron cargar los horarios disponibles."
      );
    } finally {
      setLoading(false);
    }
  };

  const seleccionarCanchaIndividual = async (cancha: CanchaIndividual) => {
    // Para canchas individuales, vamos directamente a la selección de horarios
    // sin pasar por la vista de complejos
    setComplejoSeleccionado(null);
    setCanchas([]);
    await seleccionarCancha(cancha);
  };

  const toggleHorario = (horarioId: string) => {
    const newSet = new Set(horariosSeleccionados);
    if (newSet.has(horarioId)) {
      newSet.delete(horarioId);
    } else {
      newSet.add(horarioId);
    }
    setHorariosSeleccionados(newSet);
  };

  const irAConfirmarReserva = () => {
    if (horariosSeleccionados.size === 0) {
      Alert.alert("Reserva", "Selecciona al menos un horario.");
      return;
    }

    if (!canchaSeleccionada) {
      Alert.alert("Error", "No se ha seleccionado una cancha.");
      return;
    }

    // Preparar los horarios con toda su información
    const horariosArray = Array.from(horariosSeleccionados);
    const horariosConInfo = horariosArray.map((horarioId) => {
      const horario = horarios.find((h) => h.id === horarioId);
      if (!horario) throw new Error("Horario no encontrado");
      return {
        id: horario.id,
        hora_inicio: horario.horaIni + ":00", // Agregar segundos
        hora_fin: horario.horaFin + ":00",
        fecha: fecha,
        precio: horario.precioBs,
      };
    });

    // Preparar la información de la cancha
    const canchaInfo = {
      id: canchaSeleccionada.id,
      nombre: canchaSeleccionada.nombre,
      tipoCancha: canchaSeleccionada.tipoCancha,
      tipoCampo: canchaSeleccionada.tipoCampo,
    };

    // Preparar la información del complejo (si existe)
    const complejoInfo = complejoSeleccionado
      ? {
          id: complejoSeleccionado.id,
          nombre: complejoSeleccionado.nombre,
        }
      : undefined;

    // Navegar a la pantalla de confirmación
    navigation.navigate("ConfirmarReserva", {
      cancha: canchaInfo,
      complejo: complejoInfo,
      horarios: horariosConInfo,
    });
  };

  const volver = () => {
    if (canchaSeleccionada) {
      // Si hay complejo seleccionado, volver a la lista de canchas del complejo
      // Si no, volver a la lista de resultados de búsqueda
      setCanchaSeleccionada(null);
      setHorarios([]);
      setHorariosSeleccionados(new Set());
    } else if (complejoSeleccionado) {
      setComplejoSeleccionado(null);
      setCanchas([]);
    } else {
      // Volver a la búsqueda inicial
      setComplejos([]);
      setCanchasIndividuales([]);
    }
  };

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      FUT5: "Fútbol 5",
      FUT6: "Fútbol 6",
      FUT8: "Fútbol 8",
      FUT11: "Fútbol 11",
      SINTETICO: "Césped Sintético",
      TIERRA: "Tierra Batida",
      CESPED: "Césped Natural",
    };
    return labels[tipo] || tipo;
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={colors.green} />
      <Footer />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Header con botón volver */}
        {(complejos.length > 0 || canchasIndividuales.length > 0 || complejoSeleccionado || canchaSeleccionada) && (
          <TouchableOpacity style={styles.backBtn} onPress={volver}>
            <Ionicons name="arrow-back" size={20} color={colors.dark} />
            <Text style={styles.backText}>Volver</Text>
          </TouchableOpacity>
        )}

        {/* Vista: Búsqueda inicial */}
        {!complejoSeleccionado && !canchaSeleccionada && complejos.length === 0 && canchasIndividuales.length === 0 && (
          <View style={styles.filters}>
            <Text style={styles.title}>Buscar Complejos Deportivos</Text>

            <View style={{ gap: 6 }}>
              <Text style={styles.label}>Buscar por ciudad o nombre (opcional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: La Paz, Cochabamba, San Antonio..."
                placeholderTextColor="#9AA1A5"
                value={ciudad}
                onChangeText={setCiudad}
              />
              <Text style={styles.hint}>Deja vacío para ver todos los complejos</Text>
            </View>

            <TouchableOpacity
              style={[styles.searchBtn, loading && { opacity: 0.6 }]}
              onPress={buscar}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.searchText}>{ciudad.trim() ? "BUSCAR" : "VER TODOS"}</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Vista: Lista de resultados (complejos y canchas individuales) */}
        {!complejoSeleccionado && !canchaSeleccionada && (complejos.length > 0 || canchasIndividuales.length > 0) && (
          <View>
            <Text style={styles.resultTitle}>
              {ciudad.trim() ? `Resultados para "${ciudad}"` : "Resultados"}
            </Text>

            {/* Sección: Complejos Deportivos */}
            {complejos.length > 0 && (
              <View style={{ marginBottom: 20 }}>
                <Text style={styles.sectionLabel}>Complejos Deportivos</Text>
                {complejos.map((complejo) => (
                  <TouchableOpacity
                    key={complejo.id}
                    style={styles.card}
                    onPress={() => seleccionarComplejo(complejo)}
                    activeOpacity={0.9}
                  >
                    <View style={styles.cardHeader}>
                      <Ionicons name="business" size={24} color={colors.green} />
                      <Text style={styles.cardTitle}>{complejo.nombre}</Text>
                    </View>
                    {complejo.ciudad && (
                      <Text style={styles.cardSubtitle}>
                        <Ionicons name="location" size={12} color={colors.dark} /> {complejo.ciudad}
                      </Text>
                    )}
                    {complejo.direccion && (
                      <Text style={styles.cardSubtitle}>{complejo.direccion}</Text>
                    )}
                    <View style={styles.cardFooter}>
                      <Text style={styles.precioText}>
                        Diurno: {complejo.precioDiurnoPorHora} Bs/hr
                      </Text>
                      <Text style={styles.precioText}>
                        Nocturno: {complejo.precioNocturnoPorHora} Bs/hr
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Sección: Canchas Individuales */}
            {canchasIndividuales.length > 0 && (
              <View>
                <Text style={styles.sectionLabel}>Canchas Individuales</Text>
                {canchasIndividuales.map((cancha) => (
                  <TouchableOpacity
                    key={cancha.id}
                    style={styles.card}
                    onPress={() => seleccionarCanchaIndividual(cancha)}
                    activeOpacity={0.9}
                  >
                    <View style={styles.cardHeader}>
                      <Ionicons name="grid" size={24} color={colors.green} />
                      <Text style={styles.cardTitle}>{cancha.nombre}</Text>
                    </View>
                    {cancha.ciudad && (
                      <Text style={styles.cardSubtitle}>
                        <Ionicons name="location" size={12} color={colors.dark} /> {cancha.ciudad}
                      </Text>
                    )}
                    {cancha.direccion && (
                      <Text style={styles.cardSubtitle}>{cancha.direccion}</Text>
                    )}
                    <Text style={styles.cardSubtitle}>
                      {getTipoLabel(cancha.tipoCancha)} • {getTipoLabel(cancha.tipoCampo)}
                    </Text>
                    <View style={styles.cardFooter}>
                      <Text style={styles.precioText}>
                        Diurno: {cancha.precioDiurnoPorHora} Bs/hr
                      </Text>
                      <Text style={styles.precioText}>
                        Nocturno: {cancha.precioNocturnoPorHora} Bs/hr
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Vista: Canchas del complejo */}
        {complejoSeleccionado && !canchaSeleccionada && (
          <View>
            <Text style={styles.resultTitle}>{complejoSeleccionado.nombre}</Text>
            <Text style={styles.subtitle}>Selecciona una cancha</Text>

            {loading ? (
              <ActivityIndicator size="large" color={colors.green} style={{ marginTop: 20 }} />
            ) : canchas.length > 0 ? (
              canchas.map((cancha) => (
                <TouchableOpacity
                  key={cancha.id}
                  style={styles.card}
                  onPress={() => seleccionarCancha(cancha)}
                  activeOpacity={0.9}
                >
                  <View style={styles.cardHeader}>
                    <Ionicons name="grid" size={20} color={colors.green} />
                    <Text style={styles.cardTitle}>{cancha.nombre}</Text>
                  </View>
                  <Text style={styles.cardSubtitle}>
                    {getTipoLabel(cancha.tipoCancha)} • {getTipoLabel(cancha.tipoCampo)}
                  </Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.emptyText}>No hay canchas disponibles</Text>
            )}
          </View>
        )}

        {/* Vista: Horarios disponibles */}
        {canchaSeleccionada && (
          <View>
            <Text style={styles.resultTitle}>{canchaSeleccionada.nombre}</Text>

            {/* Información de fecha fija */}
            <View style={styles.fechaInfo}>
              <Ionicons name="calendar" size={18} color={colors.green} />
              <Text style={styles.fechaInfoText}>
                Fecha de reserva:{" "}
                <Text style={styles.fechaInfoDate}>
                  {new Date(fecha).toLocaleDateString("es-ES", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </Text>
              </Text>
            </View>

            <Text style={styles.horariosTitle}>Horarios Disponibles</Text>

            {loading ? (
              <ActivityIndicator size="large" color={colors.green} style={{ marginTop: 20 }} />
            ) : horarios.length > 0 ? (
              <View style={{ gap: 8, marginTop: 10 }}>
                {horarios.map((horario) => {
                  const selected = horariosSeleccionados.has(horario.id);
                  const esNocturno = horario.tipo === 'NOCTURNO';

                  return (
                    <TouchableOpacity
                      key={horario.id}
                      style={[styles.horarioCard, selected && styles.horarioCardSelected]}
                      onPress={() => toggleHorario(horario.id)}
                      activeOpacity={0.9}
                    >
                      <View style={styles.horarioInfo}>
                        <Ionicons
                          name={selected ? "checkmark-circle" : "ellipse-outline"}
                          size={24}
                          color={selected ? colors.green : "#9AA1A5"}
                        />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.horarioText}>
                            {horario.horaIni} - {horario.horaFin}
                          </Text>
                          {esNocturno && (
                            <View style={styles.nocturnoTag}>
                              <Ionicons name="moon" size={10} color="#FFA500" />
                              <Text style={styles.nocturnoText}>Nocturno</Text>
                            </View>
                          )}
                        </View>
                      </View>
                      <Text style={styles.horarioPrecio}>{horario.precioBs} Bs</Text>
                    </TouchableOpacity>
                  );
                })}

                {/* Botón de continuar */}
                <TouchableOpacity
                  style={[
                    styles.reservarBtn,
                    horariosSeleccionados.size === 0 && { opacity: 0.5 },
                  ]}
                  onPress={irAConfirmarReserva}
                  disabled={horariosSeleccionados.size === 0}
                  activeOpacity={0.85}
                >
                  <Text style={styles.reservarText}>
                    CONTINUAR ({horariosSeleccionados.size} horarios)
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={styles.emptyText}>No hay horarios disponibles para esta fecha</Text>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

/* ---------- styles ---------- */

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.lightGreen,
  },
  content: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 14,
  },

  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
    borderRadius: 20,
    marginBottom: 10,
  },
  backText: {
    color: colors.dark,
    fontWeight: "700",
  },

  title: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.dark,
    marginBottom: 10,
  },

  resultTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.dark,
    marginBottom: 6,
  },

  subtitle: {
    fontSize: 14,
    color: colors.dark,
    opacity: 0.7,
    marginBottom: 10,
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
  input: {
    height: 40,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    fontSize: 14,
    color: colors.dark,
    borderWidth: 1.5,
    borderColor: "#E6F1E9",
    elevation: 1,
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

  // Cards
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.dark,
  },
  cardSubtitle: {
    fontSize: 13,
    color: colors.dark,
    opacity: 0.7,
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: "row",
    gap: 12,
  },
  precioText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.green,
  },

  // Horarios
  horarioCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    borderWidth: 2,
    borderColor: "#E6F1E9",
  },
  horarioCardSelected: {
    borderColor: colors.green,
    backgroundColor: "#E7F6EE",
  },
  horarioInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  horarioText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.dark,
  },
  horarioPrecio: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.green,
  },

  reservarBtn: {
    marginTop: 10,
    height: 48,
    backgroundColor: colors.green,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
  },
  reservarText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.3,
  },

  emptyText: {
    textAlign: "center",
    color: colors.dark,
    opacity: 0.6,
    marginTop: 20,
    fontSize: 14,
  },
  hint: {
    fontSize: 11,
    color: colors.dark,
    opacity: 0.6,
    fontStyle: "italic",
    marginTop: 4,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.dark,
    marginTop: 10,
    marginBottom: 10,
    paddingLeft: 4,
  },

  // Información de fecha
  fechaInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#E7F6EE",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.green,
  },
  fechaInfoText: {
    flex: 1,
    fontSize: 13,
    color: colors.dark,
    opacity: 0.8,
  },
  fechaInfoDate: {
    fontWeight: "800",
    color: colors.dark,
    opacity: 1,
    textTransform: "capitalize",
  },
  horariosTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.dark,
    marginBottom: 10,
  },
  nocturnoTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  nocturnoText: {
    fontSize: 11,
    color: "#FFA500",
    fontWeight: "700",
  },
});
