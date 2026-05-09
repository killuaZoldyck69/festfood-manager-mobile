import { Feather, Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { FONTS, SIZES } from "../../constants/theme";
import { useTheme } from "../../hooks/use-theme";

export default function ScannerScreen() {
  const theme = useTheme();
  const router = useRouter();

  // Camera State
  const [permission, requestPermission] = useCameraPermissions();
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [scanned, setScanned] = useState(false);

  // Handle Loading & Permissions
  if (!permission) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]} />
    );
  }

  if (!permission.granted) {
    return (
      <View
        style={[
          styles.permissionContainer,
          { backgroundColor: theme.background },
        ]}
      >
        <Text style={[styles.permissionText, { color: theme.textMain }]}>
          We need access to your camera to scan tickets.
        </Text>
        <TouchableOpacity
          style={[styles.permissionBtn, { backgroundColor: theme.primary }]}
          onPress={requestPermission}
        >
          <Text style={[styles.permissionBtnText, { color: theme.surface }]}>
            Grant Permission
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Handle successful scan
  const handleBarcodeScanned = ({ data }: { data: string }) => {
    setScanned(true);
    // TODO: Connect to POST /api/scan with the QR token

    // Vibe Coding Mock: Show an alert, then reset scanner after 2.5s cooldown (per your NFR)
    Alert.alert("QR Scanned!", `Token: ${data}`, [
      {
        text: "Continue",
        onPress: () => {
          setTimeout(() => setScanned(false), 2500);
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Full Screen Camera */}
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        enableTorch={isTorchOn}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
      />

      <SafeAreaView style={styles.overlay}>
        {/* Top Controls Row */}
        <View style={styles.topControls}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.back()}
          >
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setIsTorchOn(!isTorchOn)}
          >
            <Ionicons
              name={isTorchOn ? "flashlight" : "flashlight-outline"}
              size={24}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </View>

        {/* Center Targeting Reticle */}
        <View style={styles.centerTarget}>
          <View style={styles.reticle}>
            {/* Top Row Corners */}
            <View style={styles.reticleRow}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
            </View>
            {/* Bottom Row Corners */}
            <View style={styles.reticleRow}>
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>
          </View>
          <Text style={styles.targetText}>
            Point camera at attendee's ticket
          </Text>
        </View>

        {/* Bottom Status Card */}
        <View style={[styles.statusCard, { backgroundColor: theme.surface }]}>
          <View style={styles.statusLeft}>
            <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
              <Feather name="user" size={20} color={theme.surface} />
            </View>
            <View>
              <Text style={[styles.statusTitle, { color: theme.primary }]}>
                Ready to Scan
              </Text>
              <Text style={[styles.statusSubtitle, { color: theme.textMuted }]}>
                Shift: Central Hub Distro
              </Text>
            </View>
          </View>

          <View
            style={[styles.badge, { backgroundColor: `${theme.success}15` }]}
          >
            <Text style={[styles.badgeText, { color: theme.success }]}>
              Online
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000", // Black background behind camera
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: SIZES.padding,
  },
  permissionText: {
    ...FONTS.body,
    textAlign: "center",
    marginBottom: 24,
  },
  permissionBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: SIZES.radius,
  },
  permissionBtnText: {
    ...FONTS.body,
    fontWeight: "600",
  },
  overlay: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: SIZES.padding,
    paddingBottom: 32, // Padding for the bottom card
  },

  // Top Controls
  topControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    paddingHorizontal: 8,
  },
  iconButton: {
    padding: 8,
    // Add a subtle drop shadow to icons so they are visible even against white backgrounds
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  // Reticle
  centerTarget: {
    alignItems: "center",
    justifyContent: "center",
  },
  reticle: {
    width: 260,
    height: 260,
    justifyContent: "space-between",
    marginBottom: 16,
  },
  reticleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  corner: {
    width: 40,
    height: 40,
    borderColor: "#FFFFFF",
    borderWidth: 4,
  },
  topLeft: {
    borderBottomWidth: 0,
    borderRightWidth: 0,
    borderTopLeftRadius: 16,
  },
  topRight: {
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderTopRightRadius: 16,
  },
  bottomLeft: {
    borderTopWidth: 0,
    borderRightWidth: 0,
    borderBottomLeftRadius: 16,
  },
  bottomRight: {
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderBottomRightRadius: 16,
  },
  targetText: {
    color: "#FFFFFF",
    ...FONTS.body,
    fontWeight: "500",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  // Bottom Status Card
  statusCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: SIZES.radius,
    marginHorizontal: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  statusLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  statusTitle: {
    ...FONTS.body,
    fontWeight: "700",
    fontSize: 16,
    marginBottom: 2,
  },
  statusSubtitle: {
    ...FONTS.muted,
    fontSize: 12,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    ...FONTS.muted,
    fontWeight: "600",
    fontSize: 12,
  },
});
