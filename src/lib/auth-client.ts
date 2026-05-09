// src/lib/auth-client.ts
import { expoClient } from "@better-auth/expo/client";
import { createAuthClient } from "better-auth/react";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const SERVER_URL = "http://192.168.0.102:5000/api/auth";

export const authClient = createAuthClient({
  baseURL: SERVER_URL,
  fetchOptions: {
    credentials: "include",
    // Injects the Origin header so Android passes CORS checks
    headers: Platform.OS !== "web" ? { Origin: SERVER_URL } : undefined,
  },
  plugins:
    Platform.OS !== "web"
      ? [
          expoClient({
            scheme: "festfoodmanager",
            storage: SecureStore,
          }),
        ]
      : [],
});
