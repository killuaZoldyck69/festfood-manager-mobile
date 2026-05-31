import { FONTS, SIZES } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { Feather, Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { File, Paths } from "expo-file-system";
import * as FileSystemLegacy from "expo-file-system/legacy";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import * as Sharing from "expo-sharing";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
type UploadStatus = "idle" | "uploading" | "downloading" | "success" | "error";

interface Props {
  hasAttendees: boolean;
  onAttendeesUpdated: () => void;
}

export default function DataImportExport({
  hasAttendees,
  onAttendeesUpdated,
}: Props) {
  const theme = useTheme();
  const router = useRouter();

  // 🔴 We removed isRedownloading and unified everything under the main status state
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [insertedCount, setInsertedCount] = useState(0);
  const [pdfUri, setPdfUri] = useState<string | null>(null);

  const getAuthHeaders = async () => {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (Platform.OS !== "web") headers["Origin"] = BASE_URL || "";
    const token = await SecureStore.getItemAsync("better-auth.session_token");
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return headers;
  };

  const downloadSampleCsv = async () => {
    const csvContent = `name,email,studentId,university,role,category,semester,section
Stephanie Perez,stephanie.perez@yahoo.com,24-71529-2,"Independent University, Bangladesh",PARTICIPANT,Project Showcase,1st,C
Christy Lee,christy.lee@student.edu.bd,200-154-975,East West University,PARTICIPANT,Hackathon,1st,B
Christopher Leonard,christopher.leonard@yahoo.com,20-41466-3,Jahangirnagar University,PARTICIPANT,General,12th,A
Sara Anderson,sara.anderson@yahoo.com,19-29774-3,East West University,PARTICIPANT,Project Showcase,10th,E
Greg Johnson,greg.johnson@yahoo.com,202-144-609,University of Liberal Arts Bangladesh,PARTICIPANT,Datathon,12th,D
Robert Johnson,robert.johnson@example.com,227-145-206,American International University-Bangladesh,PARTICIPANT,Datathon,12th,E
David Torres,david.torres@gmail.com,205-121-792,BRAC University,PARTICIPANT,Robotics,11th,D
Alicia Lee,alicia.lee@gmail.com,23-73316-2,Jahangirnagar University,PARTICIPANT,Robotics,12th,E
Kerri Carpenter,kerri.carpenter@example.com,18-62201-2,Rajshahi University of Engineering & Technology,PARTICIPANT,General,6th,B
Alexis Mullen DVM,alexis.mullen.dvm@student.edu.bd,18-70646-2,University of Liberal Arts Bangladesh,PARTICIPANT,Gaming,12th,A
Samantha Jimenez,samantha.jimenez@student.edu.bd,19-83019-1,Rajshahi University of Engineering & Technology,PARTICIPANT,Project Showcase,4th,F
Holly Hughes,holly.hughes@student.edu.bd,21-32893-1,Southeast University,PARTICIPANT,Gaming,10th,B
Mr. Barry Turner,mr..barry.turner@student.edu.bd,221-162-754,Shahjalal University of Science and Technology,PARTICIPANT,Robotics,5th,A
Nicole Phillips,nicole.phillips@gmail.com,201-118-881,Green University of Bangladesh,PARTICIPANT,Project Showcase,12th,E
Barry Smith DDS,barry.smith.dds@gmail.com,21-99988-3,United International University,PARTICIPANT,Programming Contest,3rd,D
Edward Mayo,edward.mayo@example.com,207-175-087,North South University,PARTICIPANT,General,4th,D
Kathryn Burch,kathryn.burch@student.edu.bd,22-25039-1,East West University,PARTICIPANT,Gaming,6th,E
David Mcclain,david.mcclain@yahoo.com,24-21415-2,Shahjalal University of Science and Technology,PARTICIPANT,Programming Contest,9th,E
Natasha Cooper,natasha.cooper@example.com,18-85289-2,Jahangirnagar University,PARTICIPANT,Programming Contest,3rd,A
Amy Jones,amy.jones@gmail.com,19-83976-2,Ahsanullah University of Science and Technology,PARTICIPANT,Datathon,10th,A
Carla Young,carla.young@student.edu.bd,18-13592-2,Shanto-Mariam University of Creative Technology,PARTICIPANT,Robotics,4th,B
Angela Shaw,angela.shaw@student.edu.bd,223-153-284,Military Institute of Science and Technology,PARTICIPANT,Programming Contest,11th,F
Michael Wilson,michael.wilson@student.edu.bd,20-86561-2,Ahsanullah University of Science and Technology,PARTICIPANT,Project Showcase,12th,B
Dr. Alexander Smith,dr..alexander.smith@example.com,20-82464-1,United International University,PARTICIPANT,General,9th,F
Shane Krause,shane.krause@gmail.com,207-193-742,American International University-Bangladesh,PARTICIPANT,Gaming,3rd,D
Darlene Campbell,darlene.campbell@student.edu.bd,223-148-969,BRAC University,PARTICIPANT,Project Showcase,1st,E
Mary Jackson,mary.jackson@example.com,23-13973-3,Bangladesh University of Engineering and Technology,PARTICIPANT,Project Showcase,7th,B
Kathleen Singh,kathleen.singh@yahoo.com,227-123-413,Bangladesh University of Engineering and Technology,PARTICIPANT,Gaming,8th,D
William Young,william.young@yahoo.com,204-161-920,Chittagong University of Engineering & Technology,PARTICIPANT,Hackathon,8th,E
Corey Moss,corey.moss@student.edu.bd,20-63944-1,BRAC University,PARTICIPANT,Datathon,1st,E
Betty Holland,betty.holland@example.com,212-143-412,University of Liberal Arts Bangladesh,PARTICIPANT,General,11th,F
James Mcclure,james.mcclure@student.edu.bd,24-31337-2,University of Liberal Arts Bangladesh,PARTICIPANT,Hackathon,2nd,A
Meghan Taylor,meghan.taylor@example.com,19-79499-3,East West University,PARTICIPANT,Datathon,12th,F
David Cox,david.cox@yahoo.com,18-18540-2,Jahangirnagar University,PARTICIPANT,Programming Contest,8th,B
Brian Smith,brian.smith@student.edu.bd,203-173-691,Southeast University,PARTICIPANT,Hackathon,1st,E
Luis Macias,luis.macias@gmail.com,18-98139-3,Bangladesh University of Engineering and Technology,PARTICIPANT,General,2nd,F
Matthew Summers,matthew.summers@student.edu.bd,220-127-767,Shahjalal University of Science and Technology,PARTICIPANT,Robotics,3rd,A
Paul Gilbert,paul.gilbert@student.edu.bd,18-55050-3,Green University of Bangladesh,PARTICIPANT,Robotics,5th,B
Stephen Rodriguez,stephen.rodriguez@yahoo.com,22-43357-3,University of Liberal Arts Bangladesh,PARTICIPANT,Gaming,8th,F
Jennifer Howell MD,jennifer.howell.md@student.edu.bd,18-24802-3,United International University,PARTICIPANT,Gaming,4th,B
Angela Curtis,angela.curtis@example.com,21-40939-2,Military Institute of Science and Technology,PARTICIPANT,General,9th,E
Monica Baker,monica.baker@student.edu.bd,228-116-037,North South University,PARTICIPANT,Hackathon,9th,E
Penny Mccoy,penny.mccoy@gmail.com,18-79580-1,Khulna University of Engineering & Technology,PARTICIPANT,Gaming,6th,C
William Green,william.green@yahoo.com,206-141-488,Southeast University,PARTICIPANT,Project Showcase,12th,C
David Miller,david.miller@yahoo.com,18-54029-3,Islamic University of Technology,PARTICIPANT,Hackathon,2nd,B
Nicolas Howell,nicolas.howell@gmail.com,217-169-993,American International University-Bangladesh,PARTICIPANT,Robotics,3rd,A
Tracy Bell,tracy.bell@gmail.com,230-199-215,United International University,PARTICIPANT,Hackathon,10th,C
Melinda Ryan,melinda.ryan@gmail.com,218-143-513,Military Institute of Science and Technology,PARTICIPANT,Robotics,1st,C
Rachel Gonzalez,rachel.gonzalez@student.edu.bd,229-151-107,East West University,PARTICIPANT,Programming Contest,5th,B
Nicole Howard,nicole.howard@gmail.com,19-36405-2,Shahjalal University of Science and Technology,PARTICIPANT,General,3rd,C`;
    const filename = "Sample_Fest_Attendees.csv";

    if (Platform.OS === "web") {
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
    } else if (Platform.OS === "android") {
      try {
        const permissions =
          await FileSystemLegacy.StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (permissions.granted) {
          const fileUri =
            await FileSystemLegacy.StorageAccessFramework.createFileAsync(
              permissions.directoryUri,
              filename,
              "text/csv",
            );
          await FileSystemLegacy.writeAsStringAsync(fileUri, csvContent, {
            encoding: FileSystemLegacy.EncodingType.UTF8,
          });
          Alert.alert("Success ✅", "Sample CSV saved successfully!");
        }
      } catch (error) {
        Alert.alert("Error", "Failed to save file.");
      }
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
      } catch (error) {
        Alert.alert("Error", "Failed to generate sample CSV.");
      }
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      if (!result.assets[0].name.toLowerCase().endsWith(".csv"))
        return Alert.alert("Invalid File", "Select a valid .csv file.");
      await executeTwoPhaseUpload(result.assets[0]);
    } catch (err) {
      console.error("Picker Error:", err);
    }
  };

  const executeTwoPhaseUpload = async (
    file: DocumentPicker.DocumentPickerAsset,
  ) => {
    setStatus("uploading");
    setProgress(0);
    let progressInterval = setInterval(
      () => setProgress((prev) => Math.min(prev + 5, 95)),
      800,
    );

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

      const uploadHeaders = await getAuthHeaders();
      delete uploadHeaders["Content-Type"];

      const uploadRes = await fetch(`${BASE_URL}/api/admin/upload`, {
        method: "POST",
        body: formData,
        headers: uploadHeaders,
      });
      const data = await uploadRes.json();
      clearInterval(progressInterval);

      if (uploadRes.status === 409) {
        setStatus("idle");
        return Alert.alert(
          "Upload Skipped",
          data.message || "Attendees exist.",
        );
      }
      if (!uploadRes.ok || !data.fileName)
        throw new Error(data.error || "Failed to process CSV.");

      setInsertedCount(data.insertedCount || 0);

      // Phase 2
      setStatus("downloading");
      setProgress(0);
      const downloadUrl = `${BASE_URL}/api/admin/tickets/download-temp/${data.fileName}`;
      const headers = await getAuthHeaders();

      if (Platform.OS === "web") {
        const pdfRes = await fetch(downloadUrl, {
          method: "GET",
          headers,
          credentials: "include",
        });
        const blob = await pdfRes.blob();
        const linkSource = URL.createObjectURL(blob);
        const downloadLink = document.createElement("a");
        downloadLink.href = linkSource;
        downloadLink.download = data.fileName;
        downloadLink.click();
        setPdfUri(linkSource);
      } else {
        const destFile = new File(Paths.document, data.fileName);
        const downloadResumable = FileSystemLegacy.createDownloadResumable(
          downloadUrl,
          destFile.uri,
          { headers },
          (ev) => {
            if (ev.totalBytesExpectedToWrite > 0)
              setProgress(
                Math.round(
                  (ev.totalBytesWritten / ev.totalBytesExpectedToWrite) * 100,
                ),
              );
          },
        );
        await downloadResumable.downloadAsync();
        setPdfUri(destFile.uri);
      }

      onAttendeesUpdated();
      setStatus("success");
    } catch (error: any) {
      clearInterval(progressInterval);
      setStatus("error");
      Alert.alert("Process Failed", error.message);
    }
  };

  const sharePdf = async () => {
    if (!pdfUri) return Alert.alert("Error", "PDF file could not be located.");
    if (Platform.OS === "web") {
      const link = document.createElement("a");
      link.href = pdfUri;
      link.download = `Fest_Tickets_${Date.now()}.pdf`;
      link.click();
      return;
    }
    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(
          pdfUri.startsWith("file://") ? pdfUri : `file://${pdfUri}`,
          { mimeType: "application/pdf", UTI: "com.adobe.pdf" },
        );
      }
    } catch (error: any) {
      Alert.alert("Share Error", error.message);
    }
  };

  // 🔴 FIX: Upgraded to use the unified progress bar and tracking callbacks
  const redownloadAllTickets = async () => {
    setStatus("downloading");
    setProgress(0);

    try {
      const headers = await getAuthHeaders();
      const endpoint = `${BASE_URL}/api/admin/tickets/download-all`;
      const filename = `All_Fest_Tickets_Backup_${Date.now()}.pdf`;

      if (Platform.OS === "web") {
        const res = await fetch(endpoint, { method: "GET", headers });
        if (!res.ok) throw new Error("Failed to generate PDF.");
        setProgress(100);
        const blob = await res.blob();
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
      } else {
        const destFile = new File(Paths.document, filename);

        const downloadResumable = FileSystemLegacy.createDownloadResumable(
          endpoint,
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

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(destFile.uri, {
            mimeType: "application/pdf",
            UTI: "com.adobe.pdf",
          });
        }
      }
    } catch (error: any) {
      Alert.alert("Download Failed", error.message);
    } finally {
      // Revert back to the form UI once done
      setStatus("idle");
    }
  };

  return (
    <View>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.textMain }]}>
          Data Import & Export
        </Text>
      </View>

      {(status === "uploading" || status === "downloading") && (
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
                ? "Uploading & Processing Data..."
                : "Generating Ticket PDF..."}
            </Text>
            <Text style={[styles.progressPercentage, { color: theme.primary }]}>
              {Math.round(progress)}%
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
              Imported {insertedCount} attendees!
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: theme.primary }]}
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
            onPress={() => {
              setStatus("idle");
              router.push("/directory");
            }}
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
              View Directory
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {status === "idle" && (
        <>
          {/* 🔴 FIX: Upgraded to a professional solid-bordered guide card */}
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

          {/* 🔴 FIX: Cleaned up dropzone text and spacing */}
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
              Tap to select CSV file
            </Text>
            <Text
              style={{
                ...FONTS.body,
                color: theme.textMuted,
                fontSize: 13,
                marginTop: 4,
              }}
            >
              Strictly .csv format
            </Text>
          </TouchableOpacity>

          {hasAttendees && (
            <TouchableOpacity
              style={[
                styles.secondaryButton,
                { borderColor: theme.primary, marginBottom: 24 },
              ]}
              onPress={redownloadAllTickets}
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
                REDOWNLOAD TICKETS BACKUP
              </Text>
            </TouchableOpacity>
          )}
        </>
      )}
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

  // 🔴 NEW: Solid professional guide card
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
});
