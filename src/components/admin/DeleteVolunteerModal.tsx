import { FONTS, SIZES } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface DeleteVolunteerModalProps {
  visible: boolean;
  volunteerName: string;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
}

export default function DeleteVolunteerModal({
  visible,
  volunteerName,
  onClose,
  onConfirm,
  isPending,
}: DeleteVolunteerModalProps) {
  const theme = useTheme();

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centerModalOverlay}>
        <View
          style={[
            styles.confirmModalCard,
            { backgroundColor: theme.background },
          ]}
        >
          <View
            style={[
              styles.warningIconBg,
              { backgroundColor: `${theme.error}15` },
            ]}
          >
            <Feather name="user-x" size={32} color={theme.error} />
          </View>

          <Text
            style={[
              styles.confirmModalTitle,
              { color: theme.textMain, textAlign: "center" },
            ]}
          >
            Remove Volunteer?
          </Text>

          <Text style={[styles.confirmModalText, { color: theme.textMuted }]}>
            Are you sure you want to revoke access for{" "}
            <Text style={{ fontWeight: "700", color: theme.textMain }}>
              {volunteerName}
            </Text>
            ? Their past scan records will remain, but they will no longer be
            able to log in.
          </Text>

          <View style={styles.confirmModalActions}>
            <TouchableOpacity
              style={[
                styles.confirmBtn,
                styles.cancelBtn,
                { borderColor: theme.border },
              ]}
              onPress={onClose}
              disabled={isPending}
            >
              <Text style={[styles.cancelBtnText, { color: theme.textMain }]}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.confirmBtn, { backgroundColor: theme.error }]}
              onPress={onConfirm}
              disabled={isPending}
            >
              {isPending ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.acceptBtnText}>Remove</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centerModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: SIZES.padding,
  },
  confirmModalCard: {
    width: "100%",
    padding: 24,
    borderRadius: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  warningIconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  confirmModalTitle: { ...FONTS.header, fontSize: 22, marginBottom: 8 },
  confirmModalText: {
    ...FONTS.body,
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  confirmModalActions: { flexDirection: "row", width: "100%", gap: 12 },
  confirmBtn: {
    flex: 1,
    height: 50,
    borderRadius: SIZES.radius,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelBtn: { borderWidth: 1 },
  cancelBtnText: { ...FONTS.body, fontWeight: "600", fontSize: 15 },
  acceptBtnText: {
    color: "#FFF",
    ...FONTS.body,
    fontWeight: "700",
    fontSize: 15,
  },
});
