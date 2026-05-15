import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || "";
const API_URL = `${BASE_URL}/api`;

export const apiClient = async (
  endpoint: string,
  options: RequestInit = {},
) => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (Platform.OS !== "web") {
    headers["Origin"] = BASE_URL;

    try {
      const token = await SecureStore.getItemAsync("better-auth.session_token");
      if (token) headers["Authorization"] = `Bearer ${token}`;
    } catch (err) {
      console.warn("SecureStore access failed:", err);
    }
  }

  return fetch(`${API_URL}${endpoint}`, {
    ...options,
    credentials: "include",
    headers,
  });
};
