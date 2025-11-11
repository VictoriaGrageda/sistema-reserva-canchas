import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const baseURL =
  process.env.EXPO_PUBLIC_API_URL ??
  "https://sistema-reserva-canchas.onrender.com/api/v1"; // fallback productivo

export const http = axios.create({
  baseURL,
  timeout: 10000,
});

http.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);
