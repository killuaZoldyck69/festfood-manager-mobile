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
  ActivityIndicator,
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

  const [status, setStatus] = useState<UploadStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [insertedCount, setInsertedCount] = useState(0);
  const [pdfUri, setPdfUri] = useState<string | null>(null);
  const [isRedownloading, setIsRedownloading] = useState(false);

  const getAuthHeaders = async () => {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (Platform.OS !== "web") headers["Origin"] = BASE_URL || "";
    const token = await SecureStore.getItemAsync("better-auth.session_token");
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return headers;
  };

  const downloadSampleCsv = async () => {
    const csvContent = `name,email,studentId,university,role,category
Kyle Evans,kyle.evans@gmail.com,19-31661-3,Military Institute of Science and Technology,PARTICIPANT,Programming Contest
Nicholas Welch,nicholas.welch@gmail.com,212-156-616,North South University,PARTICIPANT,Project Showcase
Adam Allen,adam.allen@yahoo.com,201-178-126,Shanto-Mariam University of Creative Technology,PARTICIPANT,Hackathon
Nathan Harrell,nathan.harrell@gmail.com,214-179-116,North South University,PARTICIPANT,General
David Bradley,david.bradley@yahoo.com,216-167-107,United International University,PARTICIPANT,Hackathon
Susan Lewis,susan.lewis@gmail.com,19-15133-2,Bangladesh University of Engineering and Technology,PARTICIPANT,Gaming
Melissa Young,melissa.young@gmail.com,19-93357-3,Ahsanullah University of Science and Technology,PARTICIPANT,Gaming
Stacy Anderson,stacy.anderson@yahoo.com,22-93963-3,Green University of Bangladesh,PARTICIPANT,Programming Contest
David Jennings,david.jennings@gmail.com,222-121-140,Jahangirnagar University,PARTICIPANT,Gaming
Matthew Smith,matthew.smith@example.com,19-80613-1,"Independent University, Bangladesh",PARTICIPANT,Gaming
Matthew Olson,matthew.olson@gmail.com,214-147-412,Jahangirnagar University,PARTICIPANT,Project Showcase
Diana Smith,diana.smith@student.edu.bd,229-175-951,Bangladesh University of Engineering and Technology,PARTICIPANT,Robotics
Christopher Wallace,christopher.wallace@student.edu.bd,225-147-487,Southeast University,PARTICIPANT,Robotics
Anthony Flores,anthony.flores@gmail.com,18-87760-1,United International University,PARTICIPANT,Gaming
Jennifer Rodriguez,jennifer.rodriguez@student.edu.bd,223-130-775,University of Liberal Arts Bangladesh,PARTICIPANT,Datathon
Cynthia Lang,cynthia.lang@student.edu.bd,22-24317-2,Green University of Bangladesh,PARTICIPANT,General
Christina Marshall,christina.marshall@yahoo.com,22-81675-3,Chittagong University of Engineering & Technology,PARTICIPANT,General
Devin Coleman,devin.coleman@example.com,20-12398-2,BRAC University,PARTICIPANT,General
Daniel Jones,daniel.jones@example.com,19-48920-3,Bangladesh University of Engineering and Technology,PARTICIPANT,Hackathon
Matthew Cobb,matthew.cobb@student.edu.bd,212-184-332,Green University of Bangladesh,PARTICIPANT,General
Kaitlyn Smith,kaitlyn.smith@yahoo.com,226-152-601,Shahjalal University of Science and Technology,PARTICIPANT,General
Dawn Wade,dawn.wade@example.com,203-149-916,Chittagong University of Engineering & Technology,PARTICIPANT,Project Showcase
Zachary Gomez,zachary.gomez@student.edu.bd,218-198-247,United International University,PARTICIPANT,Programming Contest
Jacqueline Wilson,jacqueline.wilson@example.com,227-154-620,Shahjalal University of Science and Technology,PARTICIPANT,Robotics
William Washington,william.washington@yahoo.com,209-128-625,East West University,PARTICIPANT,General
Dr. Joseph Jimenez,dr..joseph.jimenez@yahoo.com,200-154-669,Daffodil International University,PARTICIPANT,Gaming
Amy White,amy.white@student.edu.bd,205-147-036,Jahangirnagar University,PARTICIPANT,Hackathon
Joseph Hamilton,joseph.hamilton@gmail.com,214-120-974,University of Liberal Arts Bangladesh,PARTICIPANT,General
Jacqueline Cox,jacqueline.cox@yahoo.com,20-26085-3,Ahsanullah University of Science and Technology,PARTICIPANT,Hackathon
Amber Gardner,amber.gardner@gmail.com,19-60950-1,Chittagong University of Engineering & Technology,PARTICIPANT,Robotics
Christine Fields,christine.fields@gmail.com,24-32520-1,BRAC University,PARTICIPANT,Robotics
Kayla Rasmussen,kayla.rasmussen@example.com,22-48227-3,Jahangirnagar University,PARTICIPANT,Project Showcase
Vanessa Rogers,vanessa.rogers@gmail.com,22-18787-1,University of Dhaka,PARTICIPANT,General
Steven Sanchez,steven.sanchez@yahoo.com,202-163-681,Daffodil International University,PARTICIPANT,Programming Contest
Jack Sloan,jack.sloan@yahoo.com,22-64927-2,Khulna University of Engineering & Technology,PARTICIPANT,General
Brendan Boyd,brendan.boyd@gmail.com,219-122-832,Chittagong University of Engineering & Technology,PARTICIPANT,Project Showcase
Margaret James,margaret.james@student.edu.bd,22-41591-2,North South University,PARTICIPANT,Gaming
Gary Douglas,gary.douglas@gmail.com,228-145-393,University of Dhaka,PARTICIPANT,Hackathon
Jason Ferguson,jason.ferguson@yahoo.com,23-10462-3,Jahangirnagar University,PARTICIPANT,Datathon
Kayla Johnston,kayla.johnston@example.com,19-56157-3,Chittagong University of Engineering & Technology,PARTICIPANT,Datathon
Misty Boyd,misty.boyd@example.com,21-82190-1,Daffodil International University,PARTICIPANT,Project Showcase
Ryan Obrien,ryan.obrien@gmail.com,19-68546-1,Ahsanullah University of Science and Technology,PARTICIPANT,Datathon
Todd Russell,todd.russell@example.com,205-162-636,"Independent University, Bangladesh",PARTICIPANT,Programming Contest
Paul Johnson,paul.johnson@gmail.com,228-157-288,East West University,PARTICIPANT,General
Kyle Wise,kyle.wise@student.edu.bd,212-156-488,Daffodil International University,PARTICIPANT,Hackathon
Julie James,julie.james@yahoo.com,206-194-169,Shanto-Mariam University of Creative Technology,PARTICIPANT,Project Showcase
Charles Baker,charles.baker@gmail.com,21-11878-2,Shahjalal University of Science and Technology,PARTICIPANT,General
Erik Solomon,erik.solomon@yahoo.com,24-23521-1,Shanto-Mariam University of Creative Technology,PARTICIPANT,Robotics
Richard Fowler,richard.fowler@yahoo.com,221-124-688,United International University,PARTICIPANT,Programming Contest
Mckenzie Friedman,mckenzie.friedman@example.com,20-84567-3,Southeast University,PARTICIPANT,General`;
    const filename = "Sample_Fest_Attendees.csv";

    if (Platform.OS === "web") {
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
    } else if (Platform.OS === "android") {
      // 🔴 FIX 2: Force Android to open File Manager instead of WhatsApp
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
          Alert.alert(
            "Success 💾",
            "Sample CSV saved successfully to your selected folder!",
          );
        }
      } catch (error) {
        Alert.alert("Error", "Failed to save file to designated directory.");
      }
    } else {
      // iOS fallback (Uses Share Sheet strictly for "Save to Files")
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

        // 🔴 FIX 3: Using the explicit legacy API for downloads
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

  const redownloadAllTickets = async () => {
    setIsRedownloading(true);
    try {
      const headers = await getAuthHeaders();
      const endpoint = `${BASE_URL}/api/admin/tickets/download-all`;
      const filename = `All_Fest_Tickets_Backup_${Date.now()}.pdf`;

      if (Platform.OS === "web") {
        const res = await fetch(endpoint, { method: "GET", headers });
        if (!res.ok) throw new Error("Failed to generate PDF.");
        const blob = await res.blob();
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
      } else {
        const destFile = new File(Paths.document, filename);

        // 🔴 FIX 4: Legacy API integration
        await FileSystemLegacy.downloadAsync(endpoint, destFile.uri, {
          headers,
        });

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
      setIsRedownloading(false);
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
                ? "Uploading CSV Data..."
                : "Downloading Tickets..."}
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

      {status !== "success" &&
        status !== "uploading" &&
        status !== "downloading" && (
          <>
            <View
              style={[
                styles.guideCard,
                {
                  backgroundColor: `${theme.primary}05`,
                  borderColor: theme.primary,
                },
              ]}
            >
              <View style={styles.guideHeader}>
                <Feather name="info" size={20} color={theme.primary} />
                <Text style={[styles.guideTitle, { color: theme.primary }]}>
                  CSV Format Guide
                </Text>
              </View>
              <Text style={[styles.guideText, { color: theme.textMain }]}>
                Columns: <Text style={styles.codeText}>name</Text>,{" "}
                <Text style={styles.codeText}>email</Text>,{" "}
                <Text style={styles.codeText}>studentId</Text>,{" "}
                <Text style={styles.codeText}>university</Text>,{" "}
                <Text style={styles.codeText}>role</Text>,{" "}
                <Text style={styles.codeText}>category</Text>.
              </Text>
              <TouchableOpacity
                style={styles.downloadRow}
                onPress={downloadSampleCsv}
              >
                <Feather name="download" size={16} color={theme.primary} />
                <Text style={[styles.downloadText, { color: theme.primary }]}>
                  Download Sample CSV
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
            </TouchableOpacity>

            {hasAttendees && (
              <TouchableOpacity
                style={[
                  styles.secondaryButton,
                  { borderColor: theme.primary, marginBottom: 24 },
                ]}
                onPress={redownloadAllTickets}
                disabled={isRedownloading}
              >
                {isRedownloading ? (
                  <ActivityIndicator
                    color={theme.primary}
                    style={{ marginRight: 8 }}
                  />
                ) : (
                  <Feather
                    name="download-cloud"
                    size={20}
                    color={theme.primary}
                    style={{ marginRight: 8 }}
                  />
                )}
                <Text
                  style={[styles.secondaryButtonText, { color: theme.primary }]}
                >
                  {isRedownloading
                    ? "GENERATING PDF..."
                    : "REDOWNLOAD TICKETS BACKUP"}
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
