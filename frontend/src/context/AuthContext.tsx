import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { http } from "../api/http";

export type User = {
  id: number | string;
  nombre: string;
  apellidos: string;
  correo: string;
  rol: "cliente" | "administrador";
  telefono?: string | null;
  foto_perfil?: string | null;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (correo: string, contrasena: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  changeRole: (rol: "cliente" | "administrador") => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({} as any);
export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Cargar token y user al iniciar la app (clave para fijar el stack correcto)
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem("token");
        if (stored) {
          setToken(stored);
          http.defaults.headers.common.Authorization = `Bearer ${stored}`;
          await refreshUser(); // <- trae user con rol actualizado del backend
        }
      } finally {
        setLoading(false); // <- SOLO después de intentar refreshUser
      }
    })();
  }, []);

  const login = async (correo: string, contrasena: string) => {
    const res = await http.post("/auth/login", { correo, contrasena });
    const tk = res.data?.data?.token as string | undefined;
    if (!tk) throw new Error("Token no recibido");

    await AsyncStorage.setItem("token", tk);
    setToken(tk);
    http.defaults.headers.common.Authorization = `Bearer ${tk}`;

    await refreshUser(); // <- importante para tener rol antes de navegar
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    await AsyncStorage.removeItem("token");
    delete http.defaults.headers.common.Authorization;
  };

  const refreshUser = async () => {
    const res = await http.get<{ data: User }>("/usuarios/me");
    setUser(res.data.data);
  };

  const changeRole = async (rol: "cliente" | "administrador") => {
    await http.patch("/usuarios/me/role", { rol });
    await refreshUser(); // <- re-lee user para tener el rol nuevo
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, refreshUser, changeRole }}>
      {children}
    </AuthContext.Provider>
  );
};
