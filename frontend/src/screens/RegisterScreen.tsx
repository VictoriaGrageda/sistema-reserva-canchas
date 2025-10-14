import React, { useState } from "react";
import {
  View,
  Text,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  StyleSheet,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import colors from "../theme/colors";
import FormInput from "../components/FormInput";
import PrimaryButton from "../components/PrimaryButton";
import { AuthAPI } from "../api/auth";
import { parseApiError, humanMessageFor } from "../utils/httpErrors";
import { useAuth } from "../context/AuthContext"; // ⬅️ NUEVO

type Props = NativeStackScreenProps<any, "Register">;

type FE = Record<string, string[]>;


export default function RegisterScreen({ navigation }: Props) {
  const { login } = useAuth(); // ⬅️ NUEVO

  const [nombre, setNombre] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [ci, setCi] = useState("");
  const [correo, setCorreo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [pass, setPass] = useState("");
  const [pass2, setPass2] = useState("");
  const [loading, setLoading] = useState(false);

  // errores por campo
  const [errors, setErrors] = useState<FE>({});

  const first = (arr?: string[]) => (Array.isArray(arr) && arr.length ? arr[0] : null);

  const onRegister = async () => {
    setErrors({});

    if (!correo || !pass) {
      Alert.alert("Registro", "Completa correo y contraseña");
      return;
    }
    if (pass !== pass2) {
      setErrors((e) => ({ ...e, confirmarContrasena: ["Las contraseñas no coinciden"] }));
      Alert.alert("Registro", "Las contraseñas no coinciden");
      return;
    }
    if (!nombre || !apellidos || !ci) {
      Alert.alert("Registro", "Completa nombre/s, apellidos y CI");
      return;
    }

    const payload = {
      nombre,
      apellidos,
      ci,
      correo,
      telefono: telefono || undefined,
      contrasena: pass,
      confirmarContrasena: pass2,
    };

    try {
      setLoading(true);
      // 1) Registrar
      await AuthAPI.register(payload);

      // 2) Login inmediato (guarda token y carga /usuarios/me en el contexto)
      await login(correo.trim(), pass);

      // 3) Ir a selección de rol (sin perder historial)
      navigation.reset({ index: 0, routes: [{ name: "PostRegister" }] });
    } catch (e: any) {
      const { status, message, fieldErrors } = parseApiError(e);

      if (fieldErrors) 
        setErrors(fieldErrors); // pínchalos en el formulario

      const friendly = humanMessageFor(status, "register") || message || "No se pudo registrar.";
      Alert.alert("Registro", friendly);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: "padding", android: undefined })}
      style={{ flex: 1, backgroundColor: colors.yellow }}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={{ flex: 1, padding: 24, justifyContent: "center", gap: 12 }}>
          <Image source={require("../../assets/images/ball.png")} style={styles.ball} />

          <Text style={{ fontSize: 22, fontWeight: "600", textAlign: "center", marginBottom: 8 }}>
            Crear cuenta
          </Text>

          <View style={styles.card}>
            <FormInput
              placeholder="Nombre(s)"
              value={nombre}
              onChangeText={setNombre}
              errorText={first(errors.nombre)}
            />
            <FormInput
              placeholder="Apellidos"
              value={apellidos}
              onChangeText={setApellidos}
              errorText={first(errors.apellidos)}
            />
            <FormInput
              placeholder="CI"
              value={ci}
              onChangeText={setCi}
              keyboardType="number-pad"
              errorText={first(errors.ci)}
            />
            <FormInput
              placeholder="Correo"
              value={correo}
              onChangeText={setCorreo}
              autoCapitalize="none"
              keyboardType="email-address"
              errorText={first(errors.correo)}
            />
            <FormInput
              placeholder="Teléfono o Celular"
              value={telefono}
              onChangeText={setTelefono}
              keyboardType="phone-pad"
              errorText={first(errors.telefono)}
            />
            <FormInput
              placeholder="Contraseña"
              value={pass}
              onChangeText={setPass}
              secureTextEntry
              errorText={first(errors.contrasena)}
            />
            <FormInput
              placeholder="Confirmar contraseña"
              value={pass2}
              onChangeText={setPass2}
              secureTextEntry
              errorText={first(errors.confirmarContrasena)}
            />

            <PrimaryButton
              title={loading ? "Creando..." : "Crear cuenta"}
              onPress={onRegister}
              disabled={loading}
            />
          </View>

          <Text style={{ textAlign: "center", marginTop: 12 }}>
            ¿Ya tienes cuenta?{" "}
            <Text style={{ color: colors.red, fontWeight: "700" }} onPress={() => navigation.replace("Login")}>
              Inicia sesión
            </Text>
          </Text>

          <Text style={{ textAlign: "center", marginTop: 18, opacity: 0.6 }}>
            API: {process.env.EXPO_PUBLIC_API_URL || "(no definida)"}
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, alignItems: "center" },
  ball: { width: 180, height: 180, marginVertical: 18, resizeMode: "contain", alignSelf: "center" },
  card: {
    width: "100%",
    borderRadius: 16,
    backgroundColor: colors.white,
    padding: 16,
    gap: 8,
    elevation: 2,
    borderColor: colors.lightGreen,
    borderWidth: 2,
  },
});
