import { useTheme } from "@/hooks/use-theme";
import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";

export default function SharedTabs({
  children,
}: {
  children: React.ReactNode;
}) {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: theme.surface },
        headerTintColor: theme.textMain,
        headerShadowVisible: false,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
          height: Platform.OS === "ios" ? 90 : 70,
          paddingBottom: Platform.OS === "ios" ? 28 : 10,
          paddingTop: 8,
          position: "relative",
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarLabelStyle: {
          fontFamily: "System",
          fontWeight: "600",
          fontSize: 11,
          marginTop: 4,
        },
      }}
    >
      {children}
    </Tabs>
  );
}
