import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

// 🔴 CRITICAL: Ensure this matches your backend IP
const API_BASE_URL = "http://192.168.0.102:5000/api";
const ORIGIN_URL = "http://192.168.0.102:5000";

export const apiClient = async (
  endpoint: string,
  options: RequestInit = {},
) => {
  const headers: any = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(options.headers || {}),
  };

  // Mobile-specific security injections
  if (Platform.OS !== "web") {
    headers["Origin"] = ORIGIN_URL; // 🔴 Fixes the BetterAuth CSRF block

    try {
      const token = await SecureStore.getItemAsync("better-auth.session_token");
      if (token) {
        headers["Authorization"] = `Bearer ${token}`; // 🔴 Fixes the 401 Unauthorized
      }
    } catch (err) {
      console.warn("SecureStore access failed", err);
    }
  }

  // Execute the standard fetch with our injected config
  return fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    credentials: "include", // Keeps Web cookies working natively
    headers,
  });
};
