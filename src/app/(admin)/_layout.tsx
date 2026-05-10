// app/(admin)/_layout.tsx
import { useTheme } from "@/hooks/use-theme";
import { Feather } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Platform } from "react-native";

export default function AdminLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: theme.surface },
        headerTintColor: theme.textMain,
        headerShadowVisible: false, // Keeps the top header flat and modern
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
          height: Platform.OS === "ios" ? 88 : 68, // Adjusts height safely for both platforms
          paddingBottom: Platform.OS === "ios" ? 28 : 12,
          paddingTop: 8,
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarLabelStyle: {
          fontFamily: "System",
          fontWeight: "500",
          fontSize: 12,
        },
      }}
    >
      {/* Tab 1: Dashboard */}
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Overview",
          tabBarLabel: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <Feather name="pie-chart" size={size} color={color} />
          ),
        }}
      />

      {/* Tab 2: Attendee Directory */}
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

      {/* Tab 3: CSV Upload */}
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
    </Tabs>
  );
}
