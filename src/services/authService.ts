import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

// TODO: Replace with your actual backend URL
const API_BASE_URL = "http://localhost:5000/api";
const TOKEN_KEY = "fest_session_token";

// 1. Platform-safe storage wrapper
const storage = {
  async getToken() {
    if (Platform.OS === "web") {
      return localStorage.getItem(TOKEN_KEY);
    }
    return await SecureStore.getItemAsync(TOKEN_KEY);
  },
  async setToken(token: string) {
    if (Platform.OS === "web") {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    }
  },
  async removeToken() {
    if (Platform.OS === "web") {
      localStorage.removeItem(TOKEN_KEY);
    } else {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
  },
};

export const authService = {
  async signIn(email: string, password: string) {
    const response = await fetch(`${API_BASE_URL}/auth/sign-in/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error("Invalid credentials");
    }

    const data = await response.json();

    if (data.token) {
      await storage.setToken(data.token); // Using safe storage
    }

    return data;
  },

  async getSession() {
    const token = await storage.getToken(); // Using safe storage

    const response = await fetch(`${API_BASE_URL}/auth/get-session`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      await storage.removeToken();
      return null;
    }

    return response.json();
  },

  async signOut() {
    const token = await storage.getToken();

    await fetch(`${API_BASE_URL}/auth/sign-out`, {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    await storage.removeToken(); // Using safe storage
  },
};
