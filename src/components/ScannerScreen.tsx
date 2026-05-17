import { FONTS } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { apiClient } from "@/utils/apiClient";
import { Feather, Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

// 🔴 UPDATED: Added DEPLETED status
type ScanStatus =
  | "IDLE"
  | "PROCESSING"
  | "SUCCESS"
  | "ALREADY_CLAIMED"
  | "INVALID"
  | "DEPLETED";

interface ScanData {
  name?: string;
  category?: string;
  claimedAt?: string;
}

interface ScannerScreenProps {
  role: "ADMIN" | "VOLUNTEER";
}

const formatTime = (dateString: string | undefined) => {
  if (!dateString) return "Unknown Time";

  if (dateString.match(/AM|PM/i)) return dateString;

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

export default function ScannerScreen({ role }: ScannerScreenProps) {
  const theme = useTheme();
  const [permission, requestPermission] = useCameraPermissions();

  const [status, setStatus] = useState<ScanStatus>("IDLE");
  const [scanData, setScanData] = useState<ScanData>({});

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <View
        style={[
          styles.container,
          styles.centerContainer,
          { backgroundColor: theme.background },
        ]}
      >
        <Feather
          name="camera-off"
          size={64}
          color={theme.textMuted}
          style={{ marginBottom: 16 }}
        />
        <Text style={[styles.title, { color: theme.textMain }]}>
          Camera Required
        </Text>
        <Pressable
          style={[styles.permissionBtn, { backgroundColor: theme.primary }]}
          onPress={requestPermission}
        >
          <Text style={styles.permissionBtnText}>Grant Permission</Text>
        </Pressable>
      </View>
    );
  }

  const handleBarcodeScanned = async ({
    type,
    data,
  }: {
    type: string;
    data: string;
  }) => {
    if (status !== "IDLE") return;
    setStatus("PROCESSING");

    try {
      const response = await apiClient("/scan", {
        method: "POST",
        body: JSON.stringify({ qrToken: data }),
      });

      const responseData = await response.json();

      if (response.ok) {
        setScanData({
          name: responseData.attendee?.name || "Unknown Attendee",
          category: responseData.attendee?.category || "General",
        });
        setStatus("SUCCESS");
      } else {
        // 🔴 UPDATED: Smart Error Matching checks for DEPLETED
        const errorMessage = (
          responseData.status ||
          responseData.error ||
          responseData.message ||
          ""
        ).toUpperCase();

        if (
          errorMessage.includes("DEPLETED") ||
          errorMessage.includes("NO FOOD")
        ) {
          setStatus("DEPLETED");
        } else if (
          errorMessage.includes("ALREADY") ||
          errorMessage.includes("CLAIMED") ||
          errorMessage.includes("DUPLICATE")
        ) {
          setScanData({
            name: responseData.attendee?.name || "Unknown Attendee",
            claimedAt:
              responseData.attendee?.claimedAt || new Date().toISOString(),
          });
          setStatus("ALREADY_CLAIMED");
        } else {
          setStatus("INVALID");
        }
      }
    } catch (error) {
      console.error("Scan API Error:", error);
      setStatus("INVALID");
    }
  };

  const resetScanner = () => {
    setStatus("IDLE");
    setScanData({});
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={status === "IDLE" ? handleBarcodeScanned : undefined}
      >
        <View style={styles.overlay}>
          <View style={styles.unfocusedContainer} />
          <View style={styles.middleContainer}>
            <View style={styles.unfocusedContainer} />
            <View style={styles.focusedContainer}>
              <View
                style={[
                  styles.corner,
                  styles.topLeft,
                  { borderColor: theme.primary },
                ]}
              />
              <View
                style={[
                  styles.corner,
                  styles.topRight,
                  { borderColor: theme.primary },
                ]}
              />
              <View
                style={[
                  styles.corner,
                  styles.bottomLeft,
                  { borderColor: theme.primary },
                ]}
              />
              <View
                style={[
                  styles.corner,
                  styles.bottomRight,
                  { borderColor: theme.primary },
                ]}
              />

              {status === "PROCESSING" && (
                <View style={styles.processingOverlay}>
                  <ActivityIndicator size="large" color={theme.primary} />
                  <Text
                    style={[styles.processingText, { color: theme.primary }]}
                  >
                    Verifying...
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.unfocusedContainer} />
          </View>
          <View style={styles.unfocusedContainer}>
            <Text style={styles.instructionText}>
              Align the QR code within the frame to scan.
            </Text>
            <Text
              style={[
                styles.instructionText,
                { fontSize: 12, marginTop: 8, opacity: 0.7 },
              ]}
            >
              Logged in as: {role}
            </Text>
          </View>
        </View>
      </CameraView>

      <Modal
        visible={status !== "IDLE" && status !== "PROCESSING"}
        animationType="fade"
        transparent={false}
      >
        {status === "SUCCESS" && (
          <Pressable
            style={[styles.outcomeContainer, { backgroundColor: "#10B981" }]}
            onPress={resetScanner}
          >
            <View style={styles.outcomeIconWrapper}>
              <Feather name="check" size={60} color="#FFF" />
            </View>
            <Text style={styles.outcomeTitle}>SUCCESS!</Text>

            <View style={styles.outcomeCard}>
              <Text style={styles.outcomeCardEyebrow}>GIVE FOOD TO:</Text>
              <Text style={styles.outcomeCardName}>{scanData.name}</Text>
              <View style={styles.divider} />
              <View style={styles.cardFooter}>
                <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                <Text style={styles.outcomeCardSubtitle}>
                  {scanData.category}
                </Text>
              </View>
            </View>

            <Text style={styles.tapToDismiss}>Tap anywhere to scan next</Text>
          </Pressable>
        )}

        {status === "ALREADY_CLAIMED" && (
          <Pressable
            style={[styles.outcomeContainer, { backgroundColor: "#EF4444" }]}
            onPress={resetScanner}
          >
            <Feather
              name="x"
              size={100}
              color="#FFF"
              style={{ marginBottom: 16 }}
            />
            <Text style={styles.outcomeTitle}>STOP!</Text>

            <View style={styles.outcomeCard}>
              <Text style={[styles.outcomeCardEyebrow, { color: "#EF4444" }]}>
                Ticket already claimed by:
              </Text>
              <View style={styles.userRow}>
                <View
                  style={[styles.dummyAvatar, { backgroundColor: "#EEF2FF" }]}
                >
                  <Ionicons name="person" size={20} color="#4F46E5" />
                </View>
                <Text style={styles.outcomeCardName}>{scanData.name}</Text>
              </View>
              <View style={styles.cardFooter}>
                <Feather name="clock" size={16} color="#6B7280" />
                <Text
                  style={[styles.outcomeCardSubtitle, { fontWeight: "700" }]}
                >
                  Claimed at: {formatTime(scanData.claimedAt)}
                </Text>
              </View>
            </View>

            <Text style={styles.tapToDismiss}>Tap anywhere to dismiss</Text>
          </Pressable>
        )}

        {status === "INVALID" && (
          <Pressable
            style={[styles.outcomeContainer, { backgroundColor: "#F59E0B" }]}
            onPress={resetScanner}
          >
            <Ionicons
              name="warning-outline"
              size={120}
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
        )}

        {/* 🔴 NEW: The Out of Stock / Depleted Modal UI */}
        {status === "DEPLETED" && (
          <Pressable
            style={[styles.outcomeContainer, { backgroundColor: "#334155" }]}
            onPress={resetScanner}
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
        )}
      </Modal>
    </View>
  );
}

// ==========================================
// STYLES
// ==========================================
const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  title: { ...FONTS.header, fontSize: 24, marginBottom: 24 },
  permissionBtn: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 8,
  },
  permissionBtnText: {
    color: "#FFF",
    ...FONTS.body,
    fontWeight: "700",
    fontSize: 16,
  },

  overlay: { flex: 1 },
  unfocusedContainer: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)" },
  middleContainer: { flexDirection: "row", height: 280 },
  focusedContainer: { width: 280, height: 280, position: "relative" },
  instructionText: {
    color: "#FFF",
    ...FONTS.body,
    textAlign: "center",
    marginTop: 40,
    fontSize: 16,
  },

  corner: { position: "absolute", width: 40, height: 40, borderWidth: 4 },
  topLeft: {
    top: 0,
    left: 0,
    borderBottomWidth: 0,
    borderRightWidth: 0,
    borderTopLeftRadius: 16,
  },
  topRight: {
    top: 0,
    right: 0,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderTopRightRadius: 16,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderTopWidth: 0,
    borderRightWidth: 0,
    borderBottomLeftRadius: 16,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderBottomRightRadius: 16,
  },

  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
  },
  processingText: { ...FONTS.body, fontWeight: "700", marginTop: 12 },

  outcomeContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  outcomeIconWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 6,
    borderColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  outcomeTitle: {
    color: "#FFF",
    fontFamily: "System",
    fontWeight: "900",
    fontSize: 36,
    letterSpacing: 1,
    marginBottom: 40,
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
    fontSize: 26,
    textAlign: "center",
    marginBottom: 20,
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
    fontWeight: "500",
    fontSize: 15,
    marginLeft: 8,
  },

  userRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  dummyAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
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
