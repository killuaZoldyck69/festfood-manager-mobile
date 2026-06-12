import { Feather, Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { FONTS } from "../constants/theme";
import { useTheme } from "../hooks/use-theme";
import { ScanStatus } from "../types";
import { formatTime } from "../utils/formatDate";

interface ScanData {
  name?: string;
  category?: string;
  email?: string;
  studentId?: string;
  semester?: string;
  section?: string;
  university?: string;
  claimedAt?: string;
}

interface ScannerOutcomeModalProps {
  visible: boolean;
  status: ScanStatus;
  scanData: ScanData;
  errorState: string | null;
  onDismiss: () => void;
}

export default function ScannerOutcomeModal({
  visible,
  status,
  scanData,
  errorState,
  onDismiss,
}: ScannerOutcomeModalProps): React.ReactElement {
  const theme = useTheme();

  const renderAttendeeDetails = () => (
    <View style={styles.detailsBlock}>
      {scanData.email && (
        <View style={styles.detailRow}>
          <Feather
            name="mail"
            size={14}
            color="#6B7280"
            style={styles.detailIcon}
          />
          <Text style={styles.detailText} numberOfLines={1}>
            {scanData.email}
          </Text>
        </View>
      )}
      {scanData.studentId && (
        <View style={styles.detailRow}>
          <Feather
            name="credit-card"
            size={14}
            color="#6B7280"
            style={styles.detailIcon}
          />
          <Text style={styles.detailText}>
            ID: {scanData.studentId}
            {scanData.semester ? `  •  Sem: ${scanData.semester}` : ""}
            {scanData.section ? `  •  Sec: ${scanData.section}` : ""}
          </Text>
        </View>
      )}
      {scanData.university && (
        <View style={styles.detailRow}>
          <Feather
            name="map-pin"
            size={14}
            color="#6B7280"
            style={styles.detailIcon}
          />
          <Text style={styles.detailText} numberOfLines={1}>
            {scanData.university}
          </Text>
        </View>
      )}
    </View>
  );

  const renderContent = () => {
    switch (status) {
      case "SUCCESS":
        return (
          <Pressable
            style={[styles.outcomeContainer, { backgroundColor: "#10B981" }]}
            onPress={onDismiss}
          >
            <View style={styles.outcomeIconWrapper}>
              <Feather name="check" size={60} color="#FFF" />
            </View>
            <Text style={styles.outcomeTitle}>SUCCESS!</Text>
            <View style={styles.outcomeCard}>
              <Text style={styles.outcomeCardEyebrow}>GIVE FOOD TO:</Text>
              <Text style={styles.outcomeCardName}>{scanData.name}</Text>
              {renderAttendeeDetails()}
              <View style={styles.divider} />
              <View style={styles.cardFooter}>
                <Ionicons name="pricetag-outline" size={16} color="#6B7280" />
                <Text style={styles.outcomeCardSubtitle}>
                  {scanData.category}
                </Text>
              </View>
            </View>
            <Text style={styles.tapToDismiss}>Tap anywhere to scan next</Text>
          </Pressable>
        );
      case "DUPLICATE":
        return (
          <Pressable
            style={[styles.outcomeContainer, { backgroundColor: "#EF4444" }]}
            onPress={onDismiss}
          >
            <Feather
              name="x"
              size={80}
              color="#FFF"
              style={{ marginBottom: 12 }}
            />
            <Text style={[styles.outcomeTitle, { marginBottom: 24 }]}>
              STOP!
            </Text>
            <View style={styles.outcomeCard}>
              <Text style={[styles.outcomeCardEyebrow, { color: "#EF4444" }]}>
                Ticket already claimed by:
              </Text>
              <Text style={styles.outcomeCardName}>{scanData.name}</Text>
              {renderAttendeeDetails()}
              <View style={styles.divider} />
              <View style={styles.cardFooter}>
                <Feather name="clock" size={16} color="#6B7280" />
                <Text
                  style={[styles.outcomeCardSubtitle, { fontWeight: "700" }]}
                >
                  Claimed at:{" "}
                  {scanData.claimedAt
                    ? formatTime(scanData.claimedAt)
                    : "Unknown"}
                </Text>
              </View>
            </View>
            <Text style={styles.tapToDismiss}>Tap anywhere to dismiss</Text>
          </Pressable>
        );
      case "INVALID":
        return (
          <Pressable
            style={[styles.outcomeContainer, { backgroundColor: "#F59E0B" }]}
            onPress={onDismiss}
          >
            <Ionicons
              name="warning-outline"
              size={100}
              color="#FFF"
              style={{ marginBottom: 16 }}
            />
            <Text style={styles.outcomeTitle}>INVALID TICKET</Text>
            <View
              style={[
                styles.outcomeCard,
                {
                  backgroundColor: "rgba(255,255,255,0.2)",
                  borderColor: "rgba(255,255,255,0.3)",
                  borderWidth: 1,
                },
              ]}
            >
              <Text
                style={[
                  styles.outcomeCardName,
                  { color: "#FFF", fontSize: 18, textAlign: "center" },
                ]}
              >
                This QR code does not belong to the Fest system.
              </Text>
              <View
                style={[
                  styles.divider,
                  { backgroundColor: "rgba(255,255,255,0.3)" },
                ]}
              />
              <View style={[styles.cardFooter, { justifyContent: "center" }]}>
                <Ionicons name="qr-code-outline" size={16} color="#FFF" />
                <Text style={[styles.outcomeCardSubtitle, { color: "#FFF" }]}>
                  Scanning Error 404
                </Text>
              </View>
            </View>
            <Text style={styles.tapToDismiss}>TAP ANYWHERE TO DISMISS</Text>
          </Pressable>
        );
      case "DEPLETED":
        return (
          <Pressable
            style={[styles.outcomeContainer, { backgroundColor: "#334155" }]}
            onPress={onDismiss}
          >
            <Feather
              name="inbox"
              size={100}
              color="#FFF"
              style={{ marginBottom: 24 }}
            />
            <Text style={styles.outcomeTitle}>OUT OF STOCK</Text>
            <View style={styles.outcomeCard}>
              <Text style={[styles.outcomeCardEyebrow, { color: "#64748B" }]}>
                INVENTORY DEPLETED
              </Text>
              <Text
                style={[
                  styles.outcomeCardName,
                  { color: "#111827", marginVertical: 16 },
                ]}
              >
                0 Food Items Remaining
              </Text>
              <View style={styles.divider} />
              <View style={[styles.cardFooter, { justifyContent: "center" }]}>
                <Feather
                  name="alert-circle"
                  size={16}
                  color="#64748B"
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    styles.outcomeCardSubtitle,
                    { color: "#475569", marginLeft: 0 },
                  ]}
                >
                  Contact an Admin to update total inventory.
                </Text>
              </View>
            </View>
            <Text style={styles.tapToDismiss}>TAP ANYWHERE TO DISMISS</Text>
          </Pressable>
        );
      case "ERROR":
        return (
          <Pressable
            style={[styles.outcomeContainer, { backgroundColor: theme.error }]}
            onPress={onDismiss}
          >
            <Feather
              name="alert-octagon"
              size={100}
              color="#FFF"
              style={{ marginBottom: 24 }}
            />
            <Text style={styles.outcomeTitle}>SYSTEM ERROR</Text>
            <View style={styles.outcomeCard}>
              <Text style={[styles.outcomeCardEyebrow, { color: theme.error }]}>
                COMMUNICATION FAILURE
              </Text>
              <Text
                style={[
                  styles.outcomeCardName,
                  { color: "#111827", marginVertical: 16, fontSize: 16 },
                ]}
              >
                {errorState}
              </Text>
            </View>
            <Text style={styles.tapToDismiss}>TAP ANYWHERE TO RETRY</Text>
          </Pressable>
        );
      default:
        return null;
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent={false}>
      {renderContent()}
    </Modal>
  );
}

const styles = StyleSheet.create({
  outcomeContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  outcomeIconWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 6,
    borderColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  outcomeTitle: {
    color: "#FFF",
    fontFamily: "System",
    fontWeight: "900",
    fontSize: 32,
    letterSpacing: 1,
    marginBottom: 30,
  },
  outcomeCard: {
    backgroundColor: "#FFF",
    width: "100%",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  outcomeCardEyebrow: {
    color: "#6B7280",
    fontFamily: "System",
    fontWeight: "700",
    fontSize: 13,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 8,
    textAlign: "center",
  },
  outcomeCardName: {
    color: "#111827",
    fontFamily: "System",
    fontWeight: "800",
    fontSize: 24,
    textAlign: "center",
    marginBottom: 20,
  },
  detailsBlock: {
    backgroundColor: "#F9FAFB",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    gap: 12,
  },
  detailRow: { flexDirection: "row", alignItems: "center" },
  detailIcon: { width: 20 },
  detailText: {
    color: "#4B5563",
    ...FONTS.body,
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    width: "100%",
    marginBottom: 16,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  outcomeCardSubtitle: {
    color: "#4B5563",
    fontFamily: "System",
    fontWeight: "600",
    fontSize: 15,
    marginLeft: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tapToDismiss: {
    color: "rgba(255,255,255,0.7)",
    fontFamily: "System",
    fontWeight: "600",
    fontSize: 14,
    textTransform: "uppercase",
    letterSpacing: 1,
    position: "absolute",
    bottom: Platform.OS === "ios" ? 50 : 30,
  },
});
