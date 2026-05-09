// app/(volunteer)/dashboard.tsx
import { FONTS, SIZES } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/hooks/use-theme";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Updated Mock Data to include the "event" field matching the design
const MOCK_SCANS = [
  {
    id: "1",
    name: "John Doe",
    event: "Datathon",
    status: "SUCCESS",
    time: "12:05 PM",
  },
  {
    id: "2",
    name: "Jane Smith",
    event: "Tech Fest",
    status: "SUCCESS",
    time: "11:58 AM",
  },
  {
    id: "3",
    name: "Michael Chen",
    event: "Gala Event",
    status: "SUCCESS",
    time: "11:42 AM",
  },
  {
    id: "4",
    name: "Sarah Williams",
    event: "Datathon",
    status: "SUCCESS",
    time: "11:30 AM",
  },
];

export default function VolunteerDashboard() {
  const theme = useTheme();
  const router = useRouter();
  const { user, signOut } = useAuth();

  const renderScanItem = ({ item }: { item: (typeof MOCK_SCANS)[0] }) => {
    // Dynamic color logic for the indicator dot
    let statusColor = theme.textMuted;
    if (item.status === "SUCCESS") statusColor = theme.success;
    if (item.status === "DUPLICATE" || item.status === "INVALID")
      statusColor = theme.error;

    return (
      <View style={[styles.scanCard, { backgroundColor: theme.surface }]}>
        <View style={styles.scanLeft}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <View>
            <Text style={[styles.scanName, { color: theme.textMain }]}>
              {item.name}
            </Text>
            <Text style={[styles.scanEvent, { color: theme.textMuted }]}>
              {item.event}
            </Text>
          </View>
        </View>
        <Text style={[styles.scanTime, { color: theme.textMuted }]}>
          {item.time}
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header Area */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image
            source={require("@/assets/images/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={[styles.userName, { color: theme.textMain }]}>
            Hello, Volunteer!
          </Text>
        </View>
        <TouchableOpacity onPress={signOut} style={styles.logoutBtn}>
          <Feather name="log-out" size={24} color={theme.textMain} />
        </TouchableOpacity>
      </View>

      {/* KPI Row (Custom layout for this specific screen) */}
      <View style={styles.kpiRow}>
        <View style={[styles.kpiCard, { backgroundColor: theme.surface }]}>
          <Text style={[styles.kpiTitle, { color: theme.textMuted }]}>
            FOOD AVAILABLE
          </Text>
          <Text style={[styles.kpiValue, { color: theme.textMain }]}>285</Text>
        </View>

        <View style={[styles.kpiCard, { backgroundColor: theme.surface }]}>
          <Text style={[styles.kpiTitle, { color: theme.textMuted }]}>
            TOTAL SERVED
          </Text>
          <Text style={[styles.kpiValue, { color: theme.primary }]}>215</Text>
        </View>
      </View>

      {/* Scan History Header */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.textMain }]}>
          My Recent Scans
        </Text>
        <TouchableOpacity>
          <Text style={[styles.viewAllText, { color: theme.primary }]}>
            View All
          </Text>
        </TouchableOpacity>
      </View>

      {/* Scan History List */}
      <FlatList
        data={MOCK_SCANS}
        keyExtractor={(item) => item.id}
        renderItem={renderScanItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />

      {/* Docked Scan Button */}
      <TouchableOpacity
        style={[styles.dockedButton, { backgroundColor: theme.primary }]}
        activeOpacity={0.8}
        onPress={() => router.push("/(volunteer)/scanner")}
      >
        <Ionicons name="qr-code-outline" size={24} color={theme.surface} />
        <Text style={[styles.dockedButtonText, { color: theme.surface }]}>
          SCAN TICKET
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: SIZES.padding,
    paddingTop: 48, // Adjusted for safer top margin
  },

  // Header Styles
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  logo: {
    width: 32,
    height: 32,
    marginRight: 12,
  },
  userName: {
    ...FONTS.header,
    fontSize: 22,
  },
  logoutBtn: {
    padding: 4,
  },

  // KPI Styles
  kpiRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 32,
    gap: 16,
  },
  kpiCard: {
    flex: 1,
    padding: 20,
    borderRadius: SIZES.radius,
    // Subtle shadow matching the design
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  kpiTitle: {
    ...FONTS.muted,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  kpiValue: {
    ...FONTS.header,
    fontSize: 36,
  },

  // Section Header Styles
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 16,
  },
  sectionTitle: {
    ...FONTS.header,
    fontSize: 20,
  },
  viewAllText: {
    ...FONTS.body,
    fontWeight: "500",
    fontSize: 14,
  },

  // List Styles
  listContent: {
    paddingBottom: 100, // Leaves room for the docked button
  },
  scanCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    marginBottom: 12,
    borderRadius: SIZES.radius,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  scanLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 16,
  },
  scanName: {
    ...FONTS.body,
    fontWeight: "600",
    marginBottom: 2,
  },
  scanEvent: {
    ...FONTS.muted,
    fontSize: 13,
  },
  scanTime: {
    ...FONTS.muted,
    fontSize: 13,
  },

  // Docked Button Styles
  dockedButton: {
    position: "absolute",
    bottom: 32,
    left: SIZES.padding,
    right: SIZES.padding,
    height: 56,
    borderRadius: SIZES.radius,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#4F46E5", // Uses primary color for shadow tint
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  dockedButtonText: {
    ...FONTS.body,
    fontWeight: "600",
    marginLeft: 12,
    letterSpacing: 0.5,
  },
});
