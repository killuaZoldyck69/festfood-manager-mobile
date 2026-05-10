import { useTheme } from "@/hooks/use-theme";
import { Feather, Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Platform, StyleSheet, View } from "react-native";

export default function VolunteerLayout() {
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
      {/* Tab 1: Volunteer Dashboard */}
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "My Dashboard",
          tabBarLabel: "Home",
          tabBarIcon: ({ color, size }) => (
            <Feather name="home" size={size} color={color} />
          ),
        }}
      />

      {/* Tab 2: FLOATING SCANNER BUTTON (Center) */}
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

      {/* Tab 3: Volunteer Scan Logs */}
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
    top: -20, // Pushes it up above the tab bar
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 4,
    borderColor: "#FFF", // Creates the cutout effect
  },
  floatingButtonActive: {
    transform: [{ scale: 0.95 }], // Slight press effect
  },
});
