import { FONTS, SIZES } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

interface AddVolunteerModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  isPending: boolean;
}

export default function AddVolunteerModal({
  visible,
  onClose,
  onSubmit,
  isPending,
}: AddVolunteerModalProps) {
  const theme = useTheme();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const handleSubmit = () => {
    if (!form.name || !form.email || !form.password) {
      Toast.show({
        type: "error",
        text1: "Missing Fields",
        text2: "Please fill out all fields.",
        position: "bottom",
      });
      return;
    }
    onSubmit(form);
  };

  const handleClose = () => {
    setForm({ name: "", email: "", password: "" });
    setShowPassword(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
    >
      {/* 2. Replaced the outer View with KeyboardAvoidingView */}
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View
          style={[styles.modalContent, { backgroundColor: theme.background }]}
        >
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.textMain }]}>
              Add Volunteer
            </Text>
            <TouchableOpacity onPress={handleClose}>
              <Feather name="x" size={24} color={theme.textMain} />
            </TouchableOpacity>
          </View>

          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.surface,
                color: theme.textMain,
                borderColor: theme.border,
              },
            ]}
            placeholder="Full Name"
            placeholderTextColor={theme.textMuted}
            value={form.name}
            onChangeText={(txt) => setForm({ ...form, name: txt })}
          />
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.surface,
                color: theme.textMain,
                borderColor: theme.border,
              },
            ]}
            placeholder="Email Address"
            placeholderTextColor={theme.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            value={form.email}
            onChangeText={(txt) => setForm({ ...form, email: txt })}
          />

          <View
            style={[
              styles.passwordContainer,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <TextInput
              style={[styles.passwordInput, { color: theme.textMain }]}
              placeholder="Password"
              placeholderTextColor={theme.textMuted}
              secureTextEntry={!showPassword}
              value={form.password}
              onChangeText={(txt) => setForm({ ...form, password: txt })}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Feather
                name={showPassword ? "eye" : "eye-off"}
                size={20}
                color={theme.textMuted}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: theme.primary }]}
            onPress={handleSubmit}
            disabled={isPending}
          >
            {isPending ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.submitButtonText}>Create Account</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: SIZES.padding,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    marginTop: 8,
  },
  modalTitle: { ...FONTS.header, fontSize: 22 },
  input: {
    ...FONTS.body,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 16,
  },
  passwordInput: { flex: 1, ...FONTS.body, padding: 16, fontSize: 16 },
  eyeIcon: { padding: 16 },
  submitButton: {
    height: 56,
    borderRadius: SIZES.radius,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  submitButtonText: {
    color: "#FFF",
    ...FONTS.body,
    fontWeight: "700",
    fontSize: 16,
  },
});
