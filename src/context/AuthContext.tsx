import { useRouter, useSegments } from "expo-router";
import React, { createContext, useContext, useEffect, useState } from "react";
import { authService } from "../services/authService";

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const segments = useSegments();
  const router = useRouter();

  // Check if a session exists when the app boots up
  useEffect(() => {
    checkSession();
  }, []);

  // Route protection logic
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup =
      segments[0] === "(admin)" || segments[0] === "(volunteer)";

    if (!user && inAuthGroup) {
      // Kick them out if they aren't logged in but trying to access protected tabs
      router.replace("/");
    } else if (user && segments[0] === undefined) {
      // Route them to their specific dashboard if they are logged in and on the index screen
      router.replace(
        user.role === "ADMIN" ? "/(admin)/dashboard" : "/(volunteer)/dashboard",
      );
    }
  }, [user, segments, isLoading]);

  const checkSession = async () => {
    try {
      const sessionData = await authService.getSession();
      if (sessionData && sessionData.user) {
        setUser(sessionData.user);
      }
    } catch (error) {
      console.error("Session check failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const data = await authService.signIn(email, password);
    // Assuming BetterAuth returns the user object upon login
    setUser(data.user);
  };

  const signOut = async () => {
    await authService.signOut();
    setUser(null);
    router.replace("/");
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
