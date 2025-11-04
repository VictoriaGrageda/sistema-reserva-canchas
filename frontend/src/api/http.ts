import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const http = axios.create({
  //ale
  baseURL: process.env.EXPO_PUBLIC_API_URL ?? "http://192.168.100.56:3000/api/v1",
  //brandon
  // baseURL: process.env.EXPO_PUBLIC_API_URL ?? "http://192.168.0.11:3000/api/v1",
  timeout: 10000,
});

http.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log("[HTTP] Token included:", token);
  } else {
    console.warn("[HTTP] No token found in AsyncStorage");
  }
  console.log("[HTTP] ->", config.method, config.url, config.data ?? "");
  return config;
});

http.interceptors.response.use(
  (r) => {
    console.log("[HTTP] <-", r.status, r.config.url);
    return r;
  },
  (e) => {
    console.log("[HTTP] !!", e?.response?.status, e?.config?.url, e?.response?.data ?? e.message);
    return Promise.reject(e);
  }
);
