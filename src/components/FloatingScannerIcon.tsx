import { useTheme } from "@/hooks/use-theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, View } from "react-native";

interface FloatingScannerIconProps {
  focused: boolean;
}

export default function FloatingScannerIcon({
  focused,
}: FloatingScannerIconProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.floatingButton,
        { backgroundColor: theme.primary },
        focused && styles.floatingButtonActive,
      ]}
    >
      <Ionicons name="qr-code-outline" size={32} color="#FFF" />
    </View>
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
    borderColor: "#FFF",
  },
  floatingButtonActive: {
    transform: [{ scale: 0.95 }], // Slight press effect
  },
});
