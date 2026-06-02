import { useTheme } from "@/hooks/use-theme";
import { Tabs } from "expo-router";
import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SharedTabs({
  children,
}: {
  children: React.ReactNode;
}) {
  const theme = useTheme();

  // Dynamically fetches the exact height of the device's bottom navigation/gesture area
  const insets = useSafeAreaInsets();

  // Establish a base height for the tab content, then safely add the device's inset.
  // We use Math.max to ensure there is always at least 10px of padding even on devices with 0 bottom inset.
  const paddingBottom = Math.max(insets.bottom, 10);
  const tabBarHeight = 60 + paddingBottom;

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: theme.surface },
        headerTintColor: theme.textMain,
        headerShadowVisible: false,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
          height: tabBarHeight,
          paddingBottom: paddingBottom,
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
