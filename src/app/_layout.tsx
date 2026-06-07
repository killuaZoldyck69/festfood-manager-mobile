import { AuthProvider } from "@/context/AuthContext";
import { useTheme } from "@/hooks/use-theme";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  const theme = useTheme();

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="auto" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: theme.background },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="(admin)" />
          <Stack.Screen name="(volunteer)" />
        </Stack>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
