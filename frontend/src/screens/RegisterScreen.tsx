import React, { useState } from "react";
import {
  View,
  Text,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import FormInput from "../components/FormInput";
import PrimaryButton from "../components/PrimaryButton";
import { AuthAPI } from "../api/auth";
import { parseApiError, humanMessageFor } from "../utils/httpErrors";

type Props = NativeStackScreenProps<any, "Register">;

type FE = Record<string, string[]>;

export default function RegisterScreen({ navigation }: Props) {
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
      Alert.alert("Registro", "Completa nombre, apellidos y CI");
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
      await AuthAPI.register(payload);
      Alert.alert("Registro", "¡Cuenta creada!", [
        { text: "OK", onPress: () => navigation.replace("Login") },
      ]);
    } catch (e: any) {
      const { status, message, fieldErrors } = parseApiError(e);

      // Si tenemos fieldErrors de Zod, pínchalos en el formulario
      if (fieldErrors) {
        setErrors(fieldErrors);
      }

      // Mensaje humano por status (si aplica)
      const friendly = humanMessageFor(status) || message;
      Alert.alert("Registro", friendly);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: "padding", android: undefined })}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={{ flex: 1, padding: 24, justifyContent: "center", gap: 12 }}>
          <Text style={{ fontSize: 22, fontWeight: "600", textAlign: "center", marginBottom: 8 }}>
            Crear cuenta
          </Text>

          <FormInput placeholder="Nombre(s)" value={nombre} onChangeText={setNombre}
            errorText={first(errors.nombre)} />
          <FormInput placeholder="Apellidos" value={apellidos} onChangeText={setApellidos}
            errorText={first(errors.apellidos)} />
          <FormInput placeholder="CI" value={ci} onChangeText={setCi} keyboardType="number-pad"
            errorText={first(errors.ci)} />
          <FormInput placeholder="Correo" value={correo} onChangeText={setCorreo}
            autoCapitalize="none" keyboardType="email-address"
            errorText={first(errors.correo)} />
          <FormInput placeholder="Teléfono (opcional)" value={telefono} onChangeText={setTelefono}
            keyboardType="phone-pad" errorText={first(errors.telefono)} />
          <FormInput placeholder="Contraseña" value={pass} onChangeText={setPass} secureTextEntry
            errorText={first(errors.contrasena)} />
          <FormInput placeholder="Confirmar contraseña" value={pass2} onChangeText={setPass2} secureTextEntry
            errorText={first(errors.confirmarContrasena)} />

          <PrimaryButton title={loading ? "Creando..." : "Crear cuenta"} onPress={onRegister} disabled={loading} />

          <Text style={{ textAlign: "center", marginTop: 12 }}>
            ¿Ya tienes cuenta?{" "}
            <Text style={{ color: "#0a7", fontWeight: "700" }} onPress={() => navigation.replace("Login")}>
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
