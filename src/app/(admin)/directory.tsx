import { useTheme } from "@/hooks/use-theme";
import { Text, View } from "react-native";

export default function AdminDirectoryScreen() {
  const theme = useTheme();
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: theme.background,
      }}
    >
      <Text style={{ color: theme.textMain, fontSize: 18 }}>
        Attendee Directory Stub
      </Text>
    </View>
  );
}
