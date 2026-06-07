import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
}

export default function DangerZone({
  onAttendeesWiped,
}: DangerZoneProps): React.ReactElement {
  const theme = useTheme();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleResetLogistics = (): void => {
    Alert.alert(
      "⚠️ Reset Inventory",
      "This will reset all inventory counts to zero. Are you absolutely sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset Inventory",
          style: "destructive",
          onPress: async () => {
            setActionLoading("RESET_LOGISTICS");
            try {
              const res = await apiClient("/admin/logistics/reset", {
                method: "POST",
              });
              if (res.ok) {
                Alert.alert("Success", "Inventory has been reset to zero.");
              } else {
                throw new Error("Failed to reset inventory.");
              }
            } catch (error) {
              Alert.alert(
                "Error",
                error instanceof Error ? error.message : "Unknown error",
              );
            } finally {
              setActionLoading(null);
            }
          },
        },
      ],
    );
  };

  const handleWipeAttendees = (): void => {
    Alert.alert(
      "☢️ WIPE ALL ATTENDEES",
      "CRITICAL WARNING: This deletes ALL attendees and scan logs. Proceed?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "WIPE DATABASE",
          style: "destructive",
          onPress: async () => {
            setActionLoading("WIPE_ATTENDEES");
            try {
              const res = await apiClient("/admin/attendees/wipe", {
                method: "DELETE",
              });
              if (res.ok) {
                Alert.alert("Wiped", "All attendee data has been eradicated.");
                onAttendeesWiped();
              } else {
                throw new Error("Failed to wipe attendees.");
              }
            } catch (error) {
              Alert.alert(
                "Error",
                error instanceof Error ? error.message : "Unknown error",
              );
            } finally {
              setActionLoading(null);
            }
          },
        },
      ],
    );
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
        onPress={handleResetLogistics}
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
        onPress={handleWipeAttendees}
        disabled={!!actionLoading}
      >
        {actionLoading === "WIPE_ATTENDEES" ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <>
            <Feather name="alert-triangle" size={20} color="#FFF" />
            <Text style={[styles.dangerButtonText, { color: "#FFF" }]}>
              Wipe All Attendees
            </Text>
          </>
        )}
      </TouchableOpacity>
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
});
