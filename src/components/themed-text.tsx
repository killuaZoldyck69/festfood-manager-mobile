// src/components/themed-text.tsx
import { FONTS } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { Text, type TextProps } from "react-native";

export type ThemedTextProps = TextProps & {
  type?: "default" | "title" | "defaultSemiBold" | "subtitle" | "link";
};

export function ThemedText({
  style,
  type = "default",
  ...rest
}: ThemedTextProps) {
  const theme = useTheme();

  return (
    <Text
      style={[
        { color: theme.textMain },
        type === "default" ? FONTS.body : undefined,
        type === "title" ? FONTS.header : undefined,
        type === "defaultSemiBold"
          ? { ...FONTS.body, fontWeight: "600" }
          : undefined,
        type === "subtitle" ? { ...FONTS.header, fontSize: 20 } : undefined,
        type === "link" ? { ...FONTS.body, color: theme.primary } : undefined,
        style,
      ]}
      {...rest}
    />
  );
}
