import FloatingScannerIcon from "@/components/FloatingScannerIcon";
import SharedTabs from "@/components/SharedTabs";
import { useTheme } from "@/hooks/use-theme";
import { Feather } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";

export default function AdminLayout() {
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
        name="directory"
        options={{
          title: "Attendee Directory",
          tabBarLabel: "Directory",
          tabBarIcon: ({ color, size }) => (
            <Feather name="users" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="scanner"
        options={{
          title: "Scan QR Ticket",
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
        name="upload"
        options={{
          title: "Upload & Export",
          tabBarLabel: "Upload",
          tabBarIcon: ({ color, size }) => (
            <Feather name="upload-cloud" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="logs"
        options={{
          title: "System Audit Logs",
          tabBarLabel: "Logs",
          tabBarIcon: ({ color, size }) => (
            <Feather name="file-text" size={size} color={color} />
          ),
        }}
      />
    </SharedTabs>
  );
}
