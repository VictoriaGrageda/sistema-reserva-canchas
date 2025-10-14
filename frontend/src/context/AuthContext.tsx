// src/context/AuthContext.tsx
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

const TOKEN_KEY = "token"; // usa el mismo nombre que ya tenías

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const setAuthHeader = (tk?: string) => {
    if (tk) http.defaults.headers.common.Authorization = `Bearer ${tk}`;
    else delete http.defaults.headers.common.Authorization;
  };

  const refreshUser = async () => {
    try {
      const res = await http.get<{ data: User }>("/usuarios/me");
      setUser(res.data.data);
    } catch (err: any) {
      // Token inválido/expirado → limpiar TODO
      await AsyncStorage.removeItem(TOKEN_KEY);
      setToken(null);
      setAuthHeader(undefined);
      setUser(null);
      throw err;
    }
  };

  // Arranque de la app
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(TOKEN_KEY);
        if (!stored) {
          // 🔑 SIN token → aseguramos limpiar headers/usuario
          setAuthHeader(undefined);
          setUser(null);
          return;
        }
        setToken(stored);
        setAuthHeader(stored);
        await refreshUser(); // trae el rol real
      } finally {
        setLoading(false); // siempre desactivar el loader
      }
    })();
  }, []);

  const login = async (correo: string, contrasena: string) => {
    const res = await http.post("/auth/login", { correo, contrasena });
    const tk = res.data?.data?.token as string | undefined;
    if (!tk) throw new Error("Token no recibido");

    await AsyncStorage.setItem(TOKEN_KEY, tk);
    setToken(tk);
    setAuthHeader(tk);
    await refreshUser(); // ya tendrás rol antes de que el navigator cambie
  };

  const logout = async () => {
    await AsyncStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setAuthHeader(undefined);
    setUser(null);
  };

  const changeRole = async (rol: "cliente" | "administrador") => {
    await http.patch("/usuarios/me/role", { rol });
    await refreshUser();
  };

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, logout, refreshUser, changeRole }}
    >
      {children}
    </AuthContext.Provider>
  );
};
