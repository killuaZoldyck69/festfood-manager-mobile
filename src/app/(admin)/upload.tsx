// app/(admin)/upload.tsx
import { FONTS, SIZES } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { savePdf } from "@/utils/downloadHelper.web";
import { Feather, Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as Sharing from "expo-sharing";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Import our smart cross-platform file helper

// 🔴 CRITICAL: Ensure this matches your backend IP
const API_URL = "http://192.168.0.102:5000/api/admin/upload";

// ==========================================
// 1. STYLES (Moved to top to satisfy strict TypeScript rules)
// ==========================================
const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: SIZES.padding, paddingTop: 24 },

  // Headers
  header: { marginBottom: 24 },
  title: { ...FONTS.header, fontSize: 28, marginBottom: 8 },
  subtitle: { ...FONTS.body, lineHeight: 22 },

  // Standard Card
  card: {
    padding: 20,
    borderRadius: SIZES.radius,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardEyebrow: {
    ...FONTS.muted,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
  },
  healthRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  healthDot: { width: 8, height: 8, borderRadius: 4 },
  healthValue: { ...FONTS.header, fontSize: 32, marginBottom: 4 },
  healthSubtitle: { ...FONTS.muted, fontSize: 14 },

  // Progress UI
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  progressTitle: { ...FONTS.body, fontWeight: "600", flex: 1, marginRight: 16 },
  progressPercentage: { ...FONTS.body, fontWeight: "700" },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    width: "100%",
    overflow: "hidden",
  },
  progressBarFill: { height: "100%", borderRadius: 4 },

  // Guide UI
  guideCard: {
    padding: 20,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderStyle: "dashed",
    marginBottom: 16,
  },
  guideHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  guideTitle: { ...FONTS.body, fontWeight: "700", fontSize: 18, marginLeft: 8 },
  guideText: { ...FONTS.body, lineHeight: 24, marginBottom: 16 },
  codeText: {
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    backgroundColor: "#E2E8F0",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 14,
  },
  downloadRow: { flexDirection: "row", alignItems: "center" },
  downloadText: { ...FONTS.body, fontWeight: "600", marginLeft: 8 },

  // Dropzone
  dropzone: {
    padding: 40,
    borderRadius: SIZES.radius,
    borderWidth: 2,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  dropzoneTitle: { ...FONTS.header, fontSize: 20, marginBottom: 8 },
  dropzoneSubtitle: { ...FONTS.muted },

  // Success UI
  successContainer: { marginTop: 8 },
  successCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    marginBottom: 24,
  },
  successText: { ...FONTS.body, fontWeight: "700", fontSize: 16, flex: 1 },

  // Buttons
  primaryButton: {
    flexDirection: "row",
    height: 56,
    borderRadius: SIZES.radius,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryButtonText: {
    color: "#FFF",
    ...FONTS.body,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  secondaryButton: {
    flexDirection: "row",
    height: 56,
    borderRadius: SIZES.radius,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: { ...FONTS.body, fontWeight: "700", letterSpacing: 0.5 },
});

// ==========================================
// 2. COMPONENT
// ==========================================
export default function AdminUploadScreen() {
  const theme = useTheme();

  // Screen State
  const [status, setStatus] = useState<
    "idle" | "uploading" | "success" | "error"
  >("idle");
  const [progress, setProgress] = useState(0);
  const [pdfUri, setPdfUri] = useState<string | null>(null);

  // Handle File Selection
  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["text/csv", "application/vnd.ms-excel"],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];

      if (file.size && file.size > 5 * 1024 * 1024) {
        Alert.alert(
          "File Too Large",
          "Please select a CSV file smaller than 5MB.",
        );
        return;
      }

      uploadFile(file);
    } catch (err) {
      console.error("Document Picker Error:", err);
    }
  };

  // Handle API Upload & PDF Retrieval
  const uploadFile = async (file: DocumentPicker.DocumentPickerAsset) => {
    setStatus("uploading");
    setProgress(10);

    try {
      const formData = new FormData();

      // Branching the FormData payload for Web vs Mobile
      if (Platform.OS === "web") {
        formData.append("file", file.file as unknown as Blob);
      } else {
        formData.append("file", {
          uri:
            Platform.OS === "android"
              ? file.uri
              : file.uri.replace("file://", ""),
          name: file.name,
          type: file.mimeType || "text/csv",
        } as any);
      }

      // Simulate UI progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => (prev >= 85 ? 85 : prev + 15));
      }, 1000);

      const response = await fetch(API_URL, {
        method: "POST",
        body: formData,
        credentials: "include",
        headers: { Accept: "application/pdf" },
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        throw new Error("Failed to process CSV and generate tickets.");
      }

      setProgress(95);
      const blob = await response.blob();
      const filename = `Fest_Tickets_${Date.now()}.pdf`;

      // Automatically routes to either Web download or Native file system based on platform
      const savedUri = await savePdf(blob, filename);

      if (savedUri) {
        setPdfUri(savedUri);
      }

      setProgress(100);
      setStatus("success");
    } catch (error: any) {
      setStatus("error");
      Alert.alert("Upload Failed", error.message);
    }
  };

  // Handle PDF Sharing/Printing
  const sharePdf = async () => {
    if (Platform.OS === "web") {
      Alert.alert(
        "Downloaded",
        "On the web, your PDF was already saved to your Downloads folder.",
      );
      return;
    }

    if (!pdfUri) return;

    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(pdfUri, {
        mimeType: "application/pdf",
        dialogTitle: "Print or Share Fest Tickets",
      });
    } else {
      Alert.alert(
        "Sharing Unavailable",
        "Sharing is not supported on this device.",
      );
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      {/* Header Info */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.textMain }]}>
          Upload & Export
        </Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>
          Streamline your festival operations by bulk importing attendee data
          and generating ready-to-print tickets with unique QR tokens.
        </Text>
      </View>

      {/* System Health Card */}
      <View style={[styles.card, { backgroundColor: theme.surface }]}>
        <View style={styles.healthRow}>
          <Text style={[styles.cardEyebrow, { color: theme.textMuted }]}>
            SYSTEM HEALTH
          </Text>
          <View
            style={[styles.healthDot, { backgroundColor: theme.success }]}
          />
        </View>
        <Text style={[styles.healthValue, { color: theme.primary }]}>
          99.8%
        </Text>
        <Text style={[styles.healthSubtitle, { color: theme.textMuted }]}>
          Uptime Status
        </Text>
      </View>

      {/* Progress State */}
      {status === "uploading" && (
        <View
          style={[
            styles.card,
            {
              backgroundColor: `${theme.primary}10`,
              borderColor: `${theme.primary}30`,
              borderWidth: 1,
            },
          ]}
        >
          <View style={styles.progressHeader}>
            <Text style={[styles.progressTitle, { color: theme.primary }]}>
              Creating QR Tokens & Generating PDF...
            </Text>
            <Text style={[styles.progressPercentage, { color: theme.primary }]}>
              {progress}%
            </Text>
          </View>
          <View
            style={[
              styles.progressBarBg,
              { backgroundColor: `${theme.primary}20` },
            ]}
          >
            <View
              style={[
                styles.progressBarFill,
                { backgroundColor: theme.primary, width: `${progress}%` },
              ]}
            />
          </View>
        </View>
      )}

      {/* Guide Card */}
      <View
        style={[
          styles.guideCard,
          { backgroundColor: `${theme.primary}05`, borderColor: theme.primary },
        ]}
      >
        <View style={styles.guideHeader}>
          <Feather name="info" size={20} color={theme.primary} />
          <Text style={[styles.guideTitle, { color: theme.primary }]}>
            CSV Preparation Guide
          </Text>
        </View>
        <Text style={[styles.guideText, { color: theme.textMain }]}>
          Ensure your CSV has these exact column headers:{" "}
          <Text style={styles.codeText}>name</Text>,{" "}
          <Text style={styles.codeText}>university</Text>,{" "}
          <Text style={styles.codeText}>role</Text>,{" "}
          <Text style={styles.codeText}>category</Text>.
        </Text>
        <TouchableOpacity style={styles.downloadRow}>
          <Feather name="download" size={16} color={theme.primary} />
          <Text style={[styles.downloadText, { color: theme.primary }]}>
            Download Sample CSV
          </Text>
        </TouchableOpacity>
      </View>

      {/* Idle / Dropzone State */}
      {status !== "success" && status !== "uploading" && (
        <TouchableOpacity
          style={[
            styles.dropzone,
            { borderColor: theme.border, backgroundColor: theme.surface },
          ]}
          activeOpacity={0.7}
          onPress={pickDocument}
        >
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: `${theme.primary}15` },
            ]}
          >
            <Ionicons
              name="cloud-upload-outline"
              size={32}
              color={theme.primary}
            />
          </View>
          <Text style={[styles.dropzoneTitle, { color: theme.textMain }]}>
            Tap to select CSV file
          </Text>
          <Text style={[styles.dropzoneSubtitle, { color: theme.textMuted }]}>
            Max file size: 5MB
          </Text>
        </TouchableOpacity>
      )}

      {/* Success State */}
      {status === "success" && (
        <View style={styles.successContainer}>
          <View
            style={[
              styles.successCard,
              {
                backgroundColor: `${theme.success}10`,
                borderColor: theme.success,
              },
            ]}
          >
            <Feather
              name="check-circle"
              size={24}
              color={theme.success}
              style={{ marginRight: 12 }}
            />
            <Text style={[styles.successText, { color: theme.success }]}>
              Attendees Imported Successfully.
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: theme.primary }]}
            activeOpacity={0.8}
            onPress={sharePdf}
          >
            <Feather
              name="printer"
              size={20}
              color="#FFF"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.primaryButtonText}>SHARE / PRINT TICKETS</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: theme.primary }]}
            activeOpacity={0.8}
            onPress={() => setStatus("idle")}
          >
            <Feather
              name="eye"
              size={20}
              color={theme.primary}
              style={{ marginRight: 8 }}
            />
            <Text
              style={[styles.secondaryButtonText, { color: theme.primary }]}
            >
              View Attendees
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Bottom padding for scroll */}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}
