import FloatingScannerIcon from "@/components/FloatingScannerIcon";
import SharedTabs from "@/components/SharedTabs";
import { useTheme } from "@/hooks/use-theme";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";

export default function AdminLayout() {
  const theme = useTheme();

  return (
    <SharedTabs>
      <Tabs.Screen
        name="inventory"
        options={{
          headerShown: false,
          tabBarLabel: "Inventory",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="inventory" size={24} color="black" />
          ),
        }}
      />

      <Tabs.Screen
        name="directory"
        options={{
          headerShown: false,
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
          headerShown: false,
          tabBarLabel: "Upload",
          tabBarIcon: ({ color, size }) => (
            <Feather name="upload-cloud" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="logs"
        options={{
          headerShown: false,
          tabBarLabel: "Logs",
          tabBarIcon: ({ color, size }) => (
            <Feather name="file-text" size={size} color={color} />
          ),
        }}
      />
    </SharedTabs>
  );
}
