import { Feather } from "@expo/vector-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BarcodeScanningResult,
  CameraView,
  useCameraPermissions,
} from "expo-camera";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { QUERY_KEYS } from "../constants/queryKeys";
import { FONTS } from "../constants/theme";
import { useTheme } from "../hooks/use-theme";
import { ScanStatus } from "../types";
import { apiClient } from "../utils/apiClient";
import ScannerOutcomeModal from "./ScannerOutcomeModal";

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

interface ScannerScreenProps {
  role: "ADMIN" | "VOLUNTEER";
}

export default function ScannerScreen({
  role,
}: ScannerScreenProps): React.ReactElement {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [permission, requestPermission] = useCameraPermissions();

  const [status, setStatus] = useState<ScanStatus>("IDLE");
  const [scanData, setScanData] = useState<ScanData>({});
  const [errorState, setErrorState] = useState<string | null>(null);

  const scanMutation = useMutation({
    mutationFn: async (qrToken: string) => {
      const response = await apiClient("/scan", {
        method: "POST",
        body: JSON.stringify({ qrToken }),
      });
      return await response.json();
    },
    onSuccess: (responseData) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.inventory });
      queryClient.invalidateQueries({ queryKey: ["logs"] });
      queryClient.invalidateQueries({ queryKey: ["volunteerLogs"] });
      queryClient.invalidateQueries({ queryKey: ["attendees"] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.logFilters });

      const attendeeData: ScanData = {
        name: responseData.attendee?.name || "Unknown Attendee",
        category: responseData.attendee?.category || "General",
        email: responseData.attendee?.email,
        studentId: responseData.attendee?.studentId,
        semester: responseData.attendee?.semester,
        section: responseData.attendee?.section,
        university: responseData.attendee?.university,
        claimedAt: responseData.attendee?.claimedAt,
      };

      switch (responseData?.status) {
        case "SUCCESS":
          setScanData(attendeeData);
          setStatus("SUCCESS");
          break;
        case "DUPLICATE":
          setScanData({
            ...attendeeData,
            claimedAt: attendeeData.claimedAt || new Date().toISOString(),
          });
          setStatus("DUPLICATE");
          break;
        case "DEPLETED":
          setStatus("DEPLETED");
          break;
        case "INVALID":
        default:
          setStatus("INVALID");
          break;
      }
    },
    onError: (error) => {
      setErrorState(error instanceof Error ? error.message : "Network error");
      setStatus("ERROR");
    },
  });

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

  const handleBarcodeScanned = (result: BarcodeScanningResult): void => {
    if (status !== "IDLE" || scanMutation.isPending) return;

    setStatus("PROCESSING");
    setErrorState(null);
    scanMutation.mutate(result.data);
  };

  const resetScanner = (): void => {
    setStatus("IDLE");
    setScanData({});
    setErrorState(null);
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={status === "IDLE" ? handleBarcodeScanned : undefined}
      />

      <View style={[StyleSheet.absoluteFill, styles.overlay]}>
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
                <Text style={[styles.processingText, { color: theme.primary }]}>
                  Verifying...
                </Text>
              </View>
            )}
          </View>
          <View style={styles.unfocusedContainer} />
        </View>

        <View style={[styles.unfocusedContainer, styles.bottomTextContainer]}>
          <Text style={styles.instructionText}>
            Align the QR code within the frame to scan.
          </Text>
          <Text style={styles.roleText}>Logged in as: {role}</Text>
        </View>
      </View>

      <ScannerOutcomeModal
        visible={status !== "IDLE" && status !== "PROCESSING"}
        status={status}
        scanData={scanData}
        errorState={errorState}
        onDismiss={resetScanner}
      />
    </View>
  );
}

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

  overlay: { flex: 1, zIndex: 10 },
  unfocusedContainer: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)" },
  middleContainer: { flexDirection: "row", height: 280 },
  focusedContainer: { width: 280, height: 280, position: "relative" },

  bottomTextContainer: {
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: 32,
  },
  instructionText: {
    color: "#FFF",
    ...FONTS.body,
    textAlign: "center",
    fontSize: 16,
    marginBottom: 8,
  },
  roleText: {
    color: "#FFF",
    ...FONTS.body,
    textAlign: "center",
    fontSize: 13,
    opacity: 0.7,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
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
});
