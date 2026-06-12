import { AuthProvider } from "@/context/AuthContext";
import { useTheme } from "@/hooks/use-theme";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 2,
      refetchOnWindowFocus: true,
    },
    mutations: {
      onError: (error) => {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: error.message,
          position: "bottom",
        });
      },
    },
  },
});

export default function RootLayout() {
  const theme = useTheme();

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
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
      </QueryClientProvider>

      <Toast />
    </SafeAreaProvider>
  );
}
