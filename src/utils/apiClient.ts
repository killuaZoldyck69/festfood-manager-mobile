import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import Toast from "react-native-toast-message";
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

  try {
    const response = await fetch(`${API_URL}${finalEndpoint}`, {
      ...options,
      credentials: "include",
      headers,
    });

    if (!response.ok) {
      if (response.status === 409 && endpoint.includes("/upload")) {
        return response;
      }

      let errorMessage = "An unexpected error occurred.";
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        errorMessage = `Server Error: ${response.status}`;
      }

      throw new Error(errorMessage);
    }

    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Network request failed";

    if (options.method && options.method !== "GET") {
      Toast.show({
        type: "error",
        text1: "Action Failed",
        text2: message,
        position: "bottom",
      });
    }

    throw new Error(message);
  }
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
