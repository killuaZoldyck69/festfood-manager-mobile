import { expoClient } from "@better-auth/expo/client";
import { createAuthClient } from "better-auth/react";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || "";
const AUTH_URL = `${BASE_URL}/api/auth`;

export const authClient = createAuthClient({
  baseURL: AUTH_URL,
  fetchOptions: {
    credentials: "include",
    headers: Platform.OS !== "web" ? { Origin: AUTH_URL } : undefined,
  },
  plugins:
    Platform.OS !== "web"
      ? [expoClient({ scheme: "festfoodmanager", storage: SecureStore })]
      : [],
});
