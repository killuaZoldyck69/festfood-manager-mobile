import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { FONTS, SIZES } from "../../constants/theme";
import { useTheme } from "../../hooks/use-theme";
import { apiClient } from "../../utils/apiClient";

interface DangerZoneProps {
  onAttendeesWiped: () => void;
  onVolunteersWiped: () => void;
}

export default function DangerZone({
  onAttendeesWiped,
  onVolunteersWiped,
}: DangerZoneProps): React.ReactElement {
  const theme = useTheme();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [modalConfig, setModalConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    actionType: "RESET_LOGISTICS" | "WIPE_ATTENDEES" | "WIPE_VOLUNTEERS" | null;
  }>({ visible: false, title: "", message: "", actionType: null });

  const confirmAction = async () => {
    const { actionType } = modalConfig;
    setModalConfig({ ...modalConfig, visible: false });

    if (!actionType) return;
    setActionLoading(actionType);

    try {
      if (actionType === "RESET_LOGISTICS") {
        const res = await apiClient("/admin/logistics/reset", {
          method: "POST",
        });
        if (!res.ok) throw new Error("Failed");
      } else if (actionType === "WIPE_ATTENDEES") {
        const res = await apiClient("/admin/attendees/wipe", {
          method: "DELETE",
        });
        if (res.ok) onAttendeesWiped();
      } else if (actionType === "WIPE_VOLUNTEERS") {
        const res = await apiClient("/admin/volunteers/wipe", {
          method: "DELETE",
        });
        if (res.ok) onVolunteersWiped();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <View style={styles.dangerZoneContainer}>
      <Text
        style={[styles.sectionTitle, { color: theme.error, marginBottom: 12 }]}
      >
        Danger Zone
      </Text>
      <Text style={[styles.dangerWarning, { color: theme.textMuted }]}>
        These actions are irreversible. Proceed with extreme caution.
      </Text>

      <TouchableOpacity
        style={[
          styles.dangerButton,
          { backgroundColor: `${theme.error}10`, borderColor: theme.error },
        ]}
        onPress={() =>
          setModalConfig({
            visible: true,
            title: "Reset Inventory?",
            message:
              "This will reset all inventory counts to zero. Are you absolutely sure?",
            actionType: "RESET_LOGISTICS",
          })
        }
        disabled={!!actionLoading}
      >
        {actionLoading === "RESET_LOGISTICS" ? (
          <ActivityIndicator color={theme.error} />
        ) : (
          <>
            <Feather name="refresh-cw" size={20} color={theme.error} />
            <Text style={[styles.dangerButtonText, { color: theme.error }]}>
              Reset Event Inventory
            </Text>
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.dangerButton,
          { backgroundColor: theme.error, borderColor: theme.error },
        ]}
        onPress={() =>
          setModalConfig({
            visible: true,
            title: "WIPE ALL ATTENDEES?",
            message:
              "CRITICAL WARNING: This deletes ALL attendees and their scan logs entirely from the database. Proceed?",
            actionType: "WIPE_ATTENDEES",
          })
        }
        disabled={!!actionLoading}
      >
        {actionLoading === "WIPE_ATTENDEES" ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <>
            <Feather name="users" size={20} color="#FFF" />
            <Text style={[styles.dangerButtonText, { color: "#FFF" }]}>
              Wipe All Attendees
            </Text>
          </>
        )}
      </TouchableOpacity>

      {/* --- NEW VOLUNTEER WIPE BUTTON --- */}
      <TouchableOpacity
        style={[
          styles.dangerButton,
          { backgroundColor: "#000", borderColor: "#000" },
        ]}
        onPress={() =>
          setModalConfig({
            visible: true,
            title: "WIPE ALL VOLUNTEERS?",
            message:
              "This will hard delete all volunteer accounts and their scan logs. Proceed?",
            actionType: "WIPE_VOLUNTEERS",
          })
        }
        disabled={!!actionLoading}
      >
        {actionLoading === "WIPE_VOLUNTEERS" ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <>
            <Feather name="user-x" size={20} color="#FFF" />
            <Text style={[styles.dangerButtonText, { color: "#FFF" }]}>
              Wipe All Volunteers
            </Text>
          </>
        )}
      </TouchableOpacity>

      {/* Danger Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent
        visible={modalConfig.visible}
        onRequestClose={() =>
          setModalConfig({ ...modalConfig, visible: false })
        }
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
              <Feather name="alert-octagon" size={32} color={theme.error} />
            </View>
            <Text
              style={[
                styles.confirmModalTitle,
                { color: theme.textMain, textAlign: "center" },
              ]}
            >
              {modalConfig.title}
            </Text>
            <Text style={[styles.confirmModalText, { color: theme.textMuted }]}>
              {modalConfig.message}
            </Text>

            <View style={styles.confirmModalActions}>
              <TouchableOpacity
                style={[
                  styles.confirmBtn,
                  styles.cancelBtn,
                  { borderColor: theme.border },
                ]}
                onPress={() =>
                  setModalConfig({ ...modalConfig, visible: false })
                }
              >
                <Text style={[styles.cancelBtnText, { color: theme.textMain }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, { backgroundColor: theme.error }]}
                onPress={confirmAction}
              >
                <Text style={styles.acceptBtnText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { ...FONTS.header, fontSize: 20 },
  dangerZoneContainer: {
    marginTop: 20,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  dangerWarning: { ...FONTS.body, fontSize: 14, marginBottom: 20 },
  dangerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    marginBottom: 12,
  },
  dangerButtonText: { ...FONTS.body, fontWeight: "700", marginLeft: 10 },
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
