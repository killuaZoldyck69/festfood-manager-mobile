import { QUERY_KEYS } from "@/constants/queryKeys";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import * as DocumentPicker from "expo-document-picker";
import { File, Paths } from "expo-file-system";
import * as FileSystemLegacy from "expo-file-system/legacy";
import * as SecureStore from "expo-secure-store";
import * as Sharing from "expo-sharing";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { API_URL } from "../../constants/api";
import { FONTS, SIZES } from "../../constants/theme";
import { useTheme } from "../../hooks/use-theme";
import { apiClient, uploadFile } from "../../utils/apiClient";

type UploadStatus =
  | "idle"
  | "uploading"
  | "generating"
  | "downloading"
  | "success";

interface Props {
  hasAttendees: boolean;
  onAttendeesUpdated: () => void;
}

export default function DataImportExport({
  hasAttendees,
  onAttendeesUpdated,
}: Props): React.ReactElement {
  const theme = useTheme();
  const queryClient = useQueryClient();

  const [status, setStatus] = useState<UploadStatus>("idle");
  const [progress, setProgress] = useState<number>(0);
  const [insertedCount, setInsertedCount] = useState<number>(0);
  const [recentInsertedIds, setRecentInsertedIds] = useState<string[]>([]);
  const [pdfUri, setPdfUri] = useState<string | null>(null);

  const [modalConfig, setModalConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: "error" | "info" | "success";
  } | null>(null);

  const showModal = (
    title: string,
    message: string,
    type: "error" | "info" | "success" = "info",
  ) => {
    setModalConfig({ visible: true, title, message, type });
  };

  const pickDocument = async (): Promise<void> => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      if (!result.assets[0].name.toLowerCase().endsWith(".csv")) {
        showModal("Invalid File", "Please select a valid .csv file.", "error");
        return;
      }
      await executeUpload(result.assets[0]);
    } catch {
      showModal("Error", "Failed to access the file system.", "error");
    }
  };

  const executeUpload = async (
    file: DocumentPicker.DocumentPickerAsset,
  ): Promise<void> => {
    setStatus("uploading");

    try {
      const formData = new FormData();
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

      const uploadRes = await uploadFile("/admin/upload", formData);
      const resData = await uploadRes.json();

      if (uploadRes.status === 409) {
        setStatus("idle");
        showModal(
          "Upload Skipped",
          resData.message || "Attendees already exist.",
          "info",
        );
        return;
      }
      if (!uploadRes.ok)
        throw new Error(resData.message || "Failed to process CSV.");

      setInsertedCount(resData.data?.insertedCount || 0);
      setRecentInsertedIds(resData.data?.insertedIds || []);

      onAttendeesUpdated();
      setStatus("success");
      setPdfUri(null);

      queryClient.invalidateQueries({ queryKey: ["attendees"] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.attendeeFilters });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.inventory });
    } catch (error) {
      setStatus("idle");
      showModal(
        "Upload Failed",
        error instanceof Error ? error.message : "Unknown error.",
        "error",
      );
    }
  };

  const generateAndDownloadTickets = async (
    type: "RECENT" | "ALL",
  ): Promise<void> => {
    try {
      setStatus("generating");

      const generateRes = await apiClient("/admin/tickets/generate", {
        method: "POST",
        body: JSON.stringify({
          type,
          attendeeIds: type === "RECENT" ? recentInsertedIds : undefined,
        }),
      });

      const genData = await generateRes.json();
      if (!generateRes.ok)
        throw new Error(genData.message || "Failed to generate PDFs.");

      const fileName = genData.data.fileName;

      setStatus("downloading");
      setProgress(0);

      if (Platform.OS === "web") {
        const pdfRes = await apiClient(
          `/admin/tickets/download-temp/${fileName}`,
          { method: "GET" },
        );
        setProgress(100);
        const blob = await pdfRes.blob();
        const linkSource = URL.createObjectURL(blob);
        const downloadLink = document.createElement("a");
        downloadLink.href = linkSource;
        downloadLink.download = fileName;
        downloadLink.click();
        setPdfUri(linkSource);
      } else {
        const downloadUrl = `${API_URL}/admin/tickets/download-temp/${fileName}`;
        const destFile = new File(Paths.document, fileName);
        const token = await SecureStore.getItemAsync(
          "better-auth.session_token",
        );

        const headers: Record<string, string> = token
          ? { Authorization: `Bearer ${token}` }
          : {};

        const downloadResumable = FileSystemLegacy.createDownloadResumable(
          downloadUrl,
          destFile.uri,
          { headers },
          (ev) => {
            if (ev.totalBytesExpectedToWrite > 0) {
              setProgress(
                Math.round(
                  (ev.totalBytesWritten / ev.totalBytesExpectedToWrite) * 100,
                ),
              );
            }
          },
        );

        await downloadResumable.downloadAsync();
        setPdfUri(destFile.uri);
      }

      setStatus("success");
    } catch (error) {
      setStatus("idle");
      showModal(
        "Process Failed",
        error instanceof Error ? error.message : "Generation failed.",
        "error",
      );
    }
  };

  const sharePdf = async (): Promise<void> => {
    if (!pdfUri)
      return showModal("Error", "No PDF available to share.", "error");
    if (Platform.OS === "web") return;
    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(
          pdfUri.startsWith("file://") ? pdfUri : `file://${pdfUri}`,
          {
            mimeType: "application/pdf",
            UTI: "com.adobe.pdf",
          },
        );
      }
    } catch (error) {
      showModal(
        "Share Error",
        error instanceof Error ? error.message : "Unknown error",
        "error",
      );
    }
  };

  const downloadSampleCsv = async (): Promise<void> => {
    const csvContent = `name,email,studentId,university,department,phoneNumber,role,category,semester,section
Maria Hunt,maria.hunt@student.edu.bd,211-191-591,Shanto-Mariam University of Creative Technology,Pharmacy,01444003443,PARTICIPANT,General,6th,C
Keith Merritt,keith.merritt@student.edu.bd,225-115-723,Green University of Bangladesh,Computer Science and Engineering (CSE),01542176891,PARTICIPANT,Hackathon,4th,C
Earl Gomez,earl.gomez@student.edu.bd,222-138-472,"Independent University, Bangladesh",English,01888412882,PARTICIPANT,Project Showcase,5th,F
Kenneth Conley,kenneth.conley@yahoo.com,215-177-899,American International University-Bangladesh,Law,01948223807,PARTICIPANT,Hackathon,3rd,A
Antonio Walters,antonio.walters@yahoo.com,220-158-059,University of Dhaka,Software Engineering,01389203063,PARTICIPANT,Hackathon,9th,A
David Lang,david.lang@gmail.com,22-67220-3,Islamic University of Technology,Pharmacy,01794369856,PARTICIPANT,Project Showcase,4th,B
Henry Olson,henry.olson@gmail.com,211-191-637,Jahangirnagar University,Graphic Design,01343708118,PARTICIPANT,Robotics,1st,A
Keith Sullivan,keith.sullivan@yahoo.com,18-60167-3,Military Institute of Science and Technology,Software Engineering,01438951351,PARTICIPANT,Gaming,4th,C
Alexander Lewis,alexander.lewis@example.com,22-87529-2,North South University,Graphic Design,01419100180,PARTICIPANT,Gaming,5th,F
Dalton Valdez,dalton.valdez@example.com,21-11647-1,University of Liberal Arts Bangladesh,Pharmacy,01974453356,PARTICIPANT,Robotics,11th,F
Christopher Walton,christopher.walton@student.edu.bd,202-142-846,United International University,Electrical and Electronic Engineering (EEE),01967533494,PARTICIPANT,Robotics,11th,F
Molly Russo,molly.russo@gmail.com,200-118-803,Military Institute of Science and Technology,Civil Engineering,01333609240,PARTICIPANT,Programming Contest,7th,F
Jamie Phillips,jamie.phillips@example.com,22-37457-1,North South University,English,01483463656,PARTICIPANT,Hackathon,10th,C
Susan Brown,susan.brown@example.com,18-14912-1,University of Dhaka,Pharmacy,01794912702,PARTICIPANT,Gaming,4th,B
Michael Jacobs,michael.jacobs@gmail.com,20-39378-3,Bangladesh University of Engineering and Technology,English,01729740381,PARTICIPANT,Programming Contest,10th,B
Danielle Lamb,danielle.lamb@student.edu.bd,221-170-965,American International University-Bangladesh,Graphic Design,01467269565,PARTICIPANT,Project Showcase,11th,E
Troy Bates,troy.bates@example.com,221-120-183,American International University-Bangladesh,English,01882335018,PARTICIPANT,General,12th,B
Laura Johnston,laura.johnston@yahoo.com,23-27827-3,Islamic University of Technology,English,01929108238,PARTICIPANT,Robotics,7th,A
David Hunt,david.hunt@student.edu.bd,19-95443-2,Jahangirnagar University,Architecture,01418474966,PARTICIPANT,General,8th,E
Kiara Miller,kiara.miller@example.com,22-47389-2,BRAC University,Architecture,01486693746,PARTICIPANT,Datathon,8th,A`;
    const filename = "Sample_Fest_Attendees.csv";

    if (Platform.OS === "web") {
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
    } else {
      try {
        const csvFile = new File(Paths.cache, filename);
        await csvFile.write(csvContent);
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(csvFile.uri, {
            mimeType: "text/csv",
            UTI: "public.comma-separated-values-text",
          });
        }
      } catch {
        showModal("Error", "Failed to generate sample CSV.", "error");
      }
    }
  };

  return (
    <View>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.textMain }]}>
          Data Import & Export
        </Text>
      </View>

      {(status === "uploading" ||
        status === "generating" ||
        status === "downloading") && (
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
              {status === "uploading"
                ? "Uploading CSV to Database..."
                : status === "generating"
                  ? "Server generating PDF tickets..."
                  : "Downloading Ticket File..."}
            </Text>
            {status === "downloading" && (
              <Text
                style={[styles.progressPercentage, { color: theme.primary }]}
              >
                {Math.round(progress)}%
              </Text>
            )}
          </View>

          {status === "downloading" ? (
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
          ) : (
            <View style={styles.spinnerContainer}>
              <ActivityIndicator size="large" color={theme.primary} />
            </View>
          )}
        </View>
      )}

      {status === "success" && (
        <View style={styles.successContainer}>
          {pdfUri ? (
            <>
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
                  Tickets downloaded successfully!
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  { backgroundColor: theme.primary },
                ]}
                onPress={sharePdf}
              >
                <Feather
                  name="share"
                  size={20}
                  color="#FFF"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.primaryButtonText}>SHARE TICKETS</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
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
                  Imported {insertedCount} attendees!
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  { backgroundColor: theme.primary },
                ]}
                onPress={() => generateAndDownloadTickets("RECENT")}
              >
                <Feather
                  name="printer"
                  size={20}
                  color="#FFF"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.primaryButtonText}>
                  DOWNLOAD TICKETS (RECENT ONLY)
                </Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: theme.primary }]}
            onPress={() => setStatus("idle")}
          >
            <Feather
              name="refresh-cw"
              size={20}
              color={theme.primary}
              style={{ marginRight: 8 }}
            />
            <Text
              style={[styles.secondaryButtonText, { color: theme.primary }]}
            >
              Upload Another CSV
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {status === "idle" && (
        <>
          <View
            style={[
              styles.guideCard,
              {
                backgroundColor: `${theme.primary}05`,
                borderColor: `${theme.primary}30`,
              },
            ]}
          >
            <View style={styles.guideHeader}>
              <Feather name="info" size={18} color={theme.primary} />
              <Text style={[styles.guideTitle, { color: theme.primary }]}>
                CSV Format Requirements
              </Text>
            </View>
            <Text style={[styles.guideText, { color: theme.textMain }]}>
              Columns: <Text style={styles.codeText}>name</Text>,{" "}
              <Text style={styles.codeText}>email</Text>,{" "}
              <Text style={styles.codeText}>studentId</Text>,{" "}
              <Text style={styles.codeText}>university</Text>,{" "}
              <Text style={styles.codeText}>department</Text>,{" "}
              <Text style={styles.codeText}>phoneNumber</Text>,{" "}
              <Text style={styles.codeText}>role</Text>,{" "}
              <Text style={styles.codeText}>category</Text>,{" "}
              <Text style={styles.codeText}>semester</Text>,{" "}
              <Text style={styles.codeText}>section</Text>
            </Text>
            <TouchableOpacity
              style={styles.downloadRow}
              onPress={downloadSampleCsv}
            >
              <Feather name="download" size={14} color={theme.primary} />
              <Text style={[styles.downloadText, { color: theme.primary }]}>
                Download Sample Template
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.dropzone,
              { borderColor: theme.border, backgroundColor: theme.surface },
            ]}
            onPress={pickDocument}
          >
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: `${theme.primary}10` },
              ]}
            >
              <Ionicons
                name="cloud-upload-outline"
                size={32}
                color={theme.primary}
              />
            </View>
            <Text style={[styles.dropzoneTitle, { color: theme.textMain }]}>
              Tap to select CSV file (Max: 5 MB)
            </Text>
          </TouchableOpacity>

          {hasAttendees && (
            <TouchableOpacity
              style={[
                styles.secondaryButton,
                { borderColor: theme.primary, marginBottom: 24 },
              ]}
              onPress={() => generateAndDownloadTickets("ALL")}
            >
              <Feather
                name="download-cloud"
                size={20}
                color={theme.primary}
                style={{ marginRight: 8 }}
              />
              <Text
                style={[styles.secondaryButtonText, { color: theme.primary }]}
              >
                REDOWNLOAD ALL TICKETS BACKUP
              </Text>
            </TouchableOpacity>
          )}
        </>
      )}

      <Modal
        animationType="fade"
        transparent
        visible={!!modalConfig}
        onRequestClose={() => setModalConfig(null)}
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
                {
                  backgroundColor:
                    modalConfig?.type === "error"
                      ? `${theme.error}15`
                      : `${theme.primary}15`,
                },
              ]}
            >
              <Feather
                name={modalConfig?.type === "error" ? "alert-triangle" : "info"}
                size={32}
                color={
                  modalConfig?.type === "error" ? theme.error : theme.primary
                }
              />
            </View>
            <Text
              style={[
                styles.confirmModalTitle,
                { color: theme.textMain, textAlign: "center" },
              ]}
            >
              {modalConfig?.title}
            </Text>
            <Text style={[styles.confirmModalText, { color: theme.textMuted }]}>
              {modalConfig?.message}
            </Text>
            <TouchableOpacity
              style={[
                styles.confirmBtn,
                {
                  backgroundColor:
                    modalConfig?.type === "error" ? theme.error : theme.primary,
                  width: "100%",
                },
              ]}
              onPress={() => setModalConfig(null)}
            >
              <Text style={styles.acceptBtnText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: { ...FONTS.header, fontSize: 20 },
  card: { padding: 20, borderRadius: SIZES.radius, marginBottom: 16 },
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
  spinnerContainer: {
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  guideCard: {
    padding: 16,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    marginBottom: 16,
  },
  guideHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  guideTitle: { ...FONTS.body, fontWeight: "700", fontSize: 15, marginLeft: 8 },
  guideText: { ...FONTS.body, lineHeight: 24, marginBottom: 16, fontSize: 14 },
  codeText: {
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    backgroundColor: "#E2E8F0",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 13,
  },
  downloadRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingVertical: 4,
  },
  downloadText: {
    ...FONTS.body,
    fontWeight: "700",
    fontSize: 13,
    marginLeft: 6,
  },
  dropzone: {
    padding: 32,
    borderRadius: SIZES.radius,
    borderWidth: 2,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  dropzoneTitle: { ...FONTS.header, fontSize: 18 },
  successContainer: { marginTop: 8, marginBottom: 24 },
  successCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    marginBottom: 24,
  },
  successText: { ...FONTS.body, fontWeight: "700", fontSize: 16, flex: 1 },
  primaryButton: {
    flexDirection: "row",
    height: 56,
    borderRadius: SIZES.radius,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
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
  confirmBtn: {
    height: 50,
    borderRadius: SIZES.radius,
    justifyContent: "center",
    alignItems: "center",
  },
  acceptBtnText: {
    color: "#FFF",
    ...FONTS.body,
    fontWeight: "700",
    fontSize: 15,
  },
});
