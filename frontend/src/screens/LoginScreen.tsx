import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  View,
  Text,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import FormInput from "../components/FormInput";
import PrimaryButton from "../components/PrimaryButton";
import { AuthAPI } from "../api/auth";
import { parseApiError, humanMessageFor } from "../utils/httpErrors";
import ball from "../../assets/images/ball.png";

type Props = NativeStackScreenProps<any, "Login">;

export default function LoginScreen({ navigation }: Props) {
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const onLogin = async () => {
    if (!correo || !contrasena) {
      Alert.alert("Login", "Completa tus credenciales");
      return;
    }
    try {
      setLoading(true);
      await login(correo, contrasena);     // ✅ guarda token y trae /usuarios/me
      // No navegamos manualmente: AppNavigator cambia el stack por rol
    } catch (e: any) {
      const { status, message } = parseApiError(e);
      const friendly = humanMessageFor(status, "login") || message;
      Alert.alert("Login", friendly);
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
        <View style={{ flex: 1, padding: 24, justifyContent: "center", gap: 16 }}>
          <Image source={ball} style={{ width: 120, height: 120, alignSelf: "center", marginBottom: 8 }} resizeMode="contain" />
          <Text style={{ fontSize: 22, fontWeight: "600", textAlign: "center", marginBottom: 8 }}>
            Iniciar sesión
          </Text>

          <FormInput placeholder="Correo" value={correo} onChangeText={setCorreo}
            keyboardType="email-address" autoCapitalize="none" />
          <FormInput placeholder="Contraseña" secureTextEntry value={contrasena} onChangeText={setContrasena} />

          <PrimaryButton title={loading ? "Ingresando..." : "Ingresar"} onPress={onLogin} disabled={loading} />

          <Text style={{ textAlign: "center", marginTop: 12 }}>
            ¿No tienes cuenta?{" "}
            <Text style={{ color: "#0a7", fontWeight: "700" }} onPress={() => navigation.navigate("Register")}>
              Regístrate
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
