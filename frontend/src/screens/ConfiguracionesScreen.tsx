import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import colors from "../theme/colors";
import Footer from "../components/Footer";
import type { NavProps } from "../navigation/types";
import { useAuth } from "../context/AuthContext";
import { http } from "../api/http";

const LABELS: Record<string, string> = {
  cliente: "Cliente",
  administrador: "Administrador",
  pendiente: "Pendiente",
};

export default function ConfiguracionesScreen({ navigation }: NavProps<"Configuraciones">) {
  const { user, refreshUser } = useAuth();
  const [nombre, setNombre] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [correo, setCorreo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const resetForm = useCallback(() => {
    if (!user) return;
    setNombre(user.nombre);
    setApellidos(user.apellidos);
    setCorreo(user.correo);
    setTelefono(user.telefono ?? "");
  }, [user]);

  useEffect(() => {
    resetForm();
  }, [resetForm]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await http.patch("/usuarios/me", {
        nombre,
        apellidos,
        correo,
        telefono,
      });
      await refreshUser();
      Alert.alert("Actualizado", "Tus datos se guardaron correctamente.");
      setIsEditing(false);
    } catch (error: any) {
      console.error("Error al actualizar perfil:", error);
      Alert.alert(
        "Error",
        error.response?.data?.message || "No se pudieron guardar los datos."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    resetForm();
    setIsEditing(false);
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={colors.green} />
      <Footer />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Mi cuenta</Text>
        <Text style={styles.subtitle}>
          Revisa tus datos y edítalos si lo deseas. El rol se muestra en la parte superior y no puede cambiarse desde aquí.
        </Text>

        <View style={styles.formRow}>
          <Text style={styles.label}>Rol asignado</Text>
          <Text style={styles.roleValue}>{LABELS[user?.rol ?? "pendiente"]}</Text>
        </View>

        {!isEditing ? (
          <View style={styles.detailCard}>
            <Text style={styles.detailLabel}>Nombre completo</Text>
            <Text style={styles.detailValue}>{`${nombre} ${apellidos}`.trim() || "-"}</Text>
            <Text style={styles.detailLabel}>Correo</Text>
            <Text style={styles.detailValue}>{correo || "-"}</Text>
            <Text style={styles.detailLabel}>Teléfono</Text>
            <Text style={styles.detailValue}>{telefono || "-"}</Text>
          </View>
        ) : (
          <View style={styles.form}>
            <Text style={styles.label}>Nombre</Text>
            <TextInput
              style={styles.input}
              value={nombre}
              onChangeText={setNombre}
              placeholder="Nombre"
            />

            <Text style={styles.label}>Apellidos</Text>
            <TextInput
              style={styles.input}
              value={apellidos}
              onChangeText={setApellidos}
              placeholder="Apellidos"
            />

            <Text style={styles.label}>Correo</Text>
            <TextInput
              style={styles.input}
              value={correo}
              onChangeText={setCorreo}
              placeholder="correo@ejemplo.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.label}>Teléfono</Text>
            <TextInput
              style={styles.input}
              value={telefono}
              onChangeText={setTelefono}
              placeholder="+591 7..."
              keyboardType="phone-pad"
            />
          </View>
        )}

        <View style={styles.actionsRow}>
          {!isEditing ? (
            <TouchableOpacity
              style={[styles.saveButton, styles.editButton]}
              onPress={() => setIsEditing(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.saveButtonText}>Editar datos</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={saving}
                activeOpacity={0.8}
              >
                <Text style={styles.saveButtonText}>{saving ? "Guardando..." : "Guardar cambios"}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, styles.cancelButton]}
                onPress={handleCancel}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.lightGreen,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.dark,
  },
  subtitle: {
    marginTop: 6,
    color: colors.dark,
    opacity: 0.8,
    marginBottom: 20,
  },
  form: {
    marginTop: 10,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  detailCard: {
    marginTop: 10,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.dark,
    marginTop: 10,
  },
  detailValue: {
    fontSize: 16,
    color: colors.dark,
    marginTop: 4,
  },
  formRow: {
    flexDirection: "column",
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    color: colors.dark,
    fontWeight: "600",
    marginBottom: 6,
  },
  roleValue: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.green,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E6E6E6",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 12,
    backgroundColor: "#FAFAFA",
  },
  actionsRow: {
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
  },
  saveButton: {
    flex: 1,
    backgroundColor: colors.green,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  editButton: {
    width: "100%",
  },
  cancelButton: {
    backgroundColor: "#E0E0E0",
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
  },
  cancelButtonText: {
    color: colors.dark,
    fontWeight: "700",
    fontSize: 16,
  },
});
