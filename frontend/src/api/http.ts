import axios from "axios";

const baseURL = process.env.EXPO_PUBLIC_API_URL || "http://192.168.1.7:3000";

export const http = axios.create({
  baseURL,
  timeout: 15000,
});
