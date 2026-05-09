import { FONTS, SIZES } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface KpiCardProps {
  title: string;
  value: string | number;
  iconName: keyof typeof Feather.glyphMap;
  iconColor?: string;
}

export function KpiCard({ title, value, iconName, iconColor }: KpiCardProps) {
  const theme = useTheme();
  const color = iconColor || theme.primary;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
        <Feather name={iconName} size={24} color={color} />
      </View>
      <Text style={[styles.value, { color: theme.textMain }]}>{value}</Text>
      <Text style={[styles.title, { color: theme.textMuted }]}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderWidth: 1,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    margin: 4,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 120,
  },
  iconContainer: {
    padding: 12,
    borderRadius: 50,
    marginBottom: 12,
  },
  value: {
    ...FONTS.header,
    fontSize: 24,
    marginBottom: 4,
  },
  title: {
    ...FONTS.muted,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
