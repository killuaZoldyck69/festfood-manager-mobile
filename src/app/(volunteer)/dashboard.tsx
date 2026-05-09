import { KpiCard } from "@/components/ui/KpiCard";
import { FONTS, SIZES } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/hooks/use-theme";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Temporary Mock Data until we connect GET /api/volunteer/logs
const MOCK_SCANS = [
  { id: "1", name: "Md. Imtiaz Mahmud", status: "SUCCESS", time: "10:42 AM" },
  { id: "2", name: "Unknown", status: "INVALID", time: "10:38 AM" },
  { id: "3", name: "Rahim Uddin", status: "DUPLICATE", time: "10:15 AM" },
];

export default function VolunteerDashboard() {
  const theme = useTheme();
  const router = useRouter();
  const { user, signOut } = useAuth();

  const renderScanItem = ({ item }: { item: (typeof MOCK_SCANS)[0] }) => {
    const isSuccess = item.status === "SUCCESS";
    const isDuplicate = item.status === "DUPLICATE";

    let statusColor = theme.textMuted;
    if (isSuccess) statusColor = theme.success;
    if (isDuplicate || item.status === "INVALID") statusColor = theme.error;

    return (
      <View style={[styles.logItem, { borderBottomColor: theme.border }]}>
        <View>
          <Text style={[styles.logName, { color: theme.textMain }]}>
            {item.name}
          </Text>
          <Text style={[styles.logTime, { color: theme.textMuted }]}>
            {item.time}
          </Text>
        </View>
        <Text style={[styles.logStatus, { color: statusColor }]}>
          {item.status}
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header Area */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: theme.textMuted }]}>
            Hello,
          </Text>
          <Text style={[styles.userName, { color: theme.textMain }]}>
            {user?.email?.split("@")[0] || "Volunteer"}
          </Text>
        </View>
        <TouchableOpacity onPress={signOut} style={styles.logoutBtn}>
          <Feather name="log-out" size={20} color={theme.textMuted} />
        </TouchableOpacity>
      </View>

      {/* KPI Row */}
      <View style={styles.kpiRow}>
        <KpiCard
          title="My Scans"
          value="142"
          iconName="check-circle"
          iconColor={theme.success}
        />
        <KpiCard title="Total Served" value="850" iconName="users" />
      </View>

      {/* Scan History List */}
      <Text style={[styles.sectionTitle, { color: theme.textMain }]}>
        Recent Scans
      </Text>
      <FlatList
        data={MOCK_SCANS}
        keyExtractor={(item) => item.id}
        renderItem={renderScanItem}
        contentContainerStyle={[
          styles.listContent,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      />

      {/* Giant Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.primary }]}
        activeOpacity={0.9}
        // onPress={() => router.push("/(volunteer)/scanner")}
      >
        <Feather name="maximize" size={28} color={theme.surface} />
        <Text style={[styles.fabText, { color: theme.surface }]}>
          SCAN TICKET
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: SIZES.padding },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    marginTop: 40,
  },
  greeting: { ...FONTS.muted },
  userName: { ...FONTS.header, fontSize: 24 },
  logoutBtn: { padding: 8 },
  kpiRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  sectionTitle: { ...FONTS.body, fontWeight: "600", marginBottom: 12 },
  listContent: {
    borderRadius: SIZES.radius,
    borderWidth: 1,
    overflow: "hidden",
  },
  logItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  logName: { ...FONTS.body, fontWeight: "500" },
  logTime: { ...FONTS.muted, fontSize: 12, marginTop: 4 },
  logStatus: { ...FONTS.muted, fontWeight: "700", fontSize: 12 },
  fab: {
    position: "absolute",
    bottom: 30,
    left: SIZES.padding,
    right: SIZES.padding,
    height: 64,
    borderRadius: 32,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  fabText: {
    ...FONTS.body,
    fontWeight: "bold",
    marginLeft: 12,
    letterSpacing: 1,
  },
});
