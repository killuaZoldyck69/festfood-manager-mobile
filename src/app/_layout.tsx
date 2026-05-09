import { useTheme } from "@/hooks/use-theme";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  const theme = useTheme();

  return (
    <>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerShown: false, // We hide the default headers to use our own UI
          contentStyle: { backgroundColor: theme.background },
        }}
      >
        {/* The 1. Global Login Screen */}
        <Stack.Screen name="index" />

        {/* The Route Groups */}
        <Stack.Screen name="(admin)" />
        <Stack.Screen name="(volunteer)" />
      </Stack>
    </>
  );
}
