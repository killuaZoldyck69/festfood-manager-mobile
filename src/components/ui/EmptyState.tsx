import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Colors } from "../../constants/theme";

interface EmptyStateProps {
  icon: keyof typeof Feather.glyphMap;
  message: string;
}

export function EmptyState({
  icon,
  message,
}: EmptyStateProps): React.ReactElement {
  return (
    <View style={styles.container}>
      <Feather name={icon} size={48} color={Colors.light.textMuted} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  message: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.light.textMuted,
    textAlign: "center",
  },
});
