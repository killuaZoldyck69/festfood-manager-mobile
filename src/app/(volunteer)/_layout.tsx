import FloatingScannerIcon from "@/components/FloatingScannerIcon";
import SharedTabs from "@/components/SharedTabs";
import { useTheme } from "@/hooks/use-theme";
import { Feather } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";

export default function VolunteerLayout() {
  const theme = useTheme();

  return (
    <SharedTabs>
      <Tabs.Screen
        name="inventory"
        options={{
          title: "My Dashboard",
          tabBarLabel: "Home",
          tabBarIcon: ({ color, size }) => (
            <Feather name="home" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="scanner"
        options={{
          title: "Scan Ticket",
          tabBarLabel: "SCAN",
          tabBarLabelStyle: {
            color: theme.primary,
            fontWeight: "800",
            fontSize: 11,
            marginTop: 4,
          },
          tabBarIcon: ({ focused }) => (
            <FloatingScannerIcon focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="logs"
        options={{
          title: "My Recent Scans",
          tabBarLabel: "Logs",
          tabBarIcon: ({ color, size }) => (
            <Feather name="clock" size={size} color={color} />
          ),
        }}
      />
    </SharedTabs>
  );
}
