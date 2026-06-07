import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { API_URL, BASE_URL } from "../constants/api";

export const apiClient = async (
  endpoint: string,
  options: RequestInit = {},
): Promise<Response> => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    "Cache-Control": "no-cache, no-store, must-revalidate",
    ...(options.headers as Record<string, string>),
  };

  if (Platform.OS !== "web") {
    headers["Origin"] = BASE_URL;

    try {
      const token = await SecureStore.getItemAsync("better-auth.session_token");
      if (token) headers["Authorization"] = `Bearer ${token}`;
    } catch {
      // Ignored
    }
  }

  let finalEndpoint = endpoint;
  if (!options.method || options.method.toUpperCase() === "GET") {
    const separator = finalEndpoint.includes("?") ? "&" : "?";
    finalEndpoint = `${finalEndpoint}${separator}_cache=${Date.now()}`;
  }

  return fetch(`${API_URL}${finalEndpoint}`, {
    ...options,
    credentials: "include",
    headers,
  });
};

export const uploadFile = async (
  endpoint: string,
  formData: FormData,
): Promise<Response> => {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Cache-Control": "no-cache, no-store, must-revalidate",
  };

  if (Platform.OS !== "web") {
    headers["Origin"] = BASE_URL;

    try {
      const token = await SecureStore.getItemAsync("better-auth.session_token");
      if (token) headers["Authorization"] = `Bearer ${token}`;
    } catch {
      // Ignored
    }
  }

  return fetch(`${API_URL}${endpoint}`, {
    method: "POST",
    body: formData,
    credentials: "include",
    headers,
  });
};
