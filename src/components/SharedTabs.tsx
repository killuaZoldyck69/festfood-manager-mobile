import { useTheme } from "@/hooks/use-theme";
import { Tabs } from "expo-router";
import React from "react";

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
          minHeight: 65,
          paddingTop: 8,
        },
        tabBarItemStyle: {
          paddingBottom: 8,
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarLabelStyle: {
          fontFamily: "System",
          fontWeight: "600",
          fontSize: 11,
        },
      }}
    >
      {children}
    </Tabs>
  );
}
