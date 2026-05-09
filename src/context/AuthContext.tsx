import { useRouter, useSegments } from "expo-router";
import React, { createContext, useContext, useEffect } from "react";
import { authClient } from "../lib/auth-client";

type Role = "ADMIN" | "VOLUNTEER" | "admin" | "volunteer";

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Use the official hook! It handles the token fetching automatically.
  const { data, isPending } = authClient.useSession();
  const segments = useSegments();
  const router = useRouter();

  const user = data?.user as User | undefined;

  // Smarter Route protection logic
  useEffect(() => {
    if (isPending) return;

    const inAuthGroup =
      segments[0] === "(admin)" || segments[0] === "(volunteer)";

    if (!user && inAuthGroup) {
      router.replace("/");
    } else if (user) {
      const isAdminUser = user.role === "ADMIN" || user.role === "admin";
      const isCorrectGroup =
        (isAdminUser && segments[0] === "(admin)") ||
        (!isAdminUser && segments[0] === "(volunteer)");

      if (!isCorrectGroup) {
        router.replace(
          isAdminUser ? "/(admin)/dashboard" : "/(volunteer)/dashboard",
        );
      }
    }
  }, [user, segments, isPending]);

  // Wrapper functions to keep your index.tsx exactly the same
  const signIn = async (email: string, password: string) => {
    const { error } = await authClient.signIn.email({ email, password });
    if (error) throw new Error(error.message);
  };

  const signOut = async () => {
    await authClient.signOut();
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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
