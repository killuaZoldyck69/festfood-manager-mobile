// app/(admin)/_layout.tsx
import { useTheme } from "@/hooks/use-theme";
import { Feather, Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Platform, StyleSheet, View } from "react-native";

export default function AdminLayout() {
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
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Command Center",
          tabBarLabel: "Home",
          tabBarIcon: ({ color, size }) => (
            <Feather name="grid" size={size} color={color} />
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

      {/* FLOATING SCANNER BUTTON */}
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
            <View
              style={[
                styles.floatingButton,
                { backgroundColor: theme.primary },
                focused && styles.floatingButtonActive,
              ]}
            >
              <Ionicons name="qr-code-outline" size={32} color="#FFF" />
            </View>
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
    </Tabs>
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    top: -20,
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 4,
    borderColor: "#FFF",
  },
  floatingButtonActive: {
    transform: [{ scale: 0.95 }],
  },
});
