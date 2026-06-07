import { useRouter, useSegments } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { createContext, useContext, useEffect } from "react";
import { Platform } from "react-native";
import { authClient } from "../lib/auth-client";

type Role = "ADMIN" | "VOLUNTEER";

interface User {
  id: string;
  email: string;
  role: Role;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const { data, isPending } = authClient.useSession();
  const segments = useSegments();
  const router = useRouter();

  const user = data?.user as User | undefined;

  useEffect(() => {
    if (isPending) return;

    const inAuthGroup =
      segments[0] === "(admin)" || segments[0] === "(volunteer)";

    if (!user && inAuthGroup) {
      router.replace("/");
    } else if (user) {
      const isAdminUser = user.role === "ADMIN";
      const isCorrectGroup =
        (isAdminUser && segments[0] === "(admin)") ||
        (!isAdminUser && segments[0] === "(volunteer)");

      if (!isCorrectGroup) {
        router.replace(
          isAdminUser ? "/(admin)/inventory" : "/(volunteer)/inventory",
        );
      }
    }
  }, [user, segments, isPending]);

  const signIn = async (email: string, password: string): Promise<void> => {
    const { data: authData, error } = await authClient.signIn.email({
      email,
      password,
    });

    if (error) throw new Error(error.message);

    if (authData && Platform.OS !== "web" && authData.token) {
      await SecureStore.setItemAsync(
        "better-auth.session_token",
        authData.token,
      );
    }
  };

  const signOut = async (): Promise<void> => {
    await authClient.signOut();

    if (Platform.OS !== "web") {
      await SecureStore.deleteItemAsync("better-auth.session_token");
    }

    router.replace("/");
  };

  return (
    <AuthContext.Provider
      value={{ user: user || null, isLoading: isPending, signIn, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
