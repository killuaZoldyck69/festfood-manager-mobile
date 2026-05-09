import { FONTS, SIZES } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme"; // <-- Importing your hook!
import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  StyleSheet,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
} from "react-native";

interface InputFieldProps extends TextInputProps {
  iconName: keyof typeof Feather.glyphMap;
  isPassword?: boolean;
}

export function InputField({
  iconName,
  isPassword,
  ...props
}: InputFieldProps) {
  const [isSecure, setIsSecure] = useState(isPassword);
  const theme = useTheme(); // <-- Getting the active colors (light or dark)

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
    >
      <Feather
        name={iconName}
        size={20}
        color={theme.textMuted}
        style={styles.icon}
      />

      <TextInput
        style={[styles.input, { color: theme.textMain }]}
        placeholderTextColor={theme.textMuted}
        secureTextEntry={isSecure}
        autoCapitalize="none"
        {...props}
      />

      {isPassword && (
        <TouchableOpacity
          onPress={() => setIsSecure(!isSecure)}
          style={styles.eyeIcon}
        >
          <Feather
            name={isSecure ? "eye" : "eye-off"}
            size={20}
            color={theme.textMuted}
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: SIZES.radius,
    height: SIZES.touchTarget,
    paddingHorizontal: SIZES.padding,
    marginBottom: SIZES.padding,
  },
  icon: { marginRight: 12 },
  input: { flex: 1, ...FONTS.body },
  eyeIcon: { padding: 4 },
});
