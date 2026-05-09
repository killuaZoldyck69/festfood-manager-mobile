import { KpiCard } from "@/components/ui/KpiCard";
import { FONTS, SIZES } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/hooks/use-theme";
import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function AdminDashboard() {
  const theme = useTheme();
  const { signOut } = useAuth();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.textMain }]}>
          Command Center
        </Text>
        <TouchableOpacity onPress={signOut} style={styles.logoutBtn}>
          <Feather name="log-out" size={20} color={theme.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Global Progress Section */}
      <View
        style={[
          styles.progressCard,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <Text style={[styles.progressTitle, { color: theme.textMuted }]}>
          Event Progress
        </Text>
        <Text style={[styles.progressPercentage, { color: theme.primary }]}>
          68%
        </Text>
        <Text style={[styles.progressSubtitle, { color: theme.textMain }]}>
          850 of 1250 Served
        </Text>
      </View>

      {/* 2x2 KPI Grid */}
      <View style={styles.kpiGrid}>
        <View style={styles.kpiRow}>
          <KpiCard title="Available" value="1250" iconName="box" />
          <KpiCard
            title="Served"
            value="850"
            iconName="check"
            iconColor={theme.success}
          />
        </View>
        <View style={styles.kpiRow}>
          <KpiCard
            title="Duplicates"
            value="42"
            iconName="copy"
            iconColor={theme.error}
          />
          <KpiCard
            title="Invalid"
            value="12"
            iconName="alert-triangle"
            iconColor={theme.error}
          />
        </View>
      </View>

      {/* Adjust Inventory Action */}
      <TouchableOpacity
        style={[styles.adjustBtn, { backgroundColor: `${theme.primary}15` }]}
      >
        <Feather name="settings" size={20} color={theme.primary} />
        <Text style={[styles.adjustBtnText, { color: theme.primary }]}>
          Adjust Logistics Inventory
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: SIZES.padding },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    marginTop: 10,
  },
  title: { ...FONTS.header, fontSize: 24 },
  logoutBtn: { padding: 8 },
  progressCard: {
    padding: 24,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    alignItems: "center",
    marginBottom: 24,
  },
  progressTitle: {
    ...FONTS.muted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  progressPercentage: { ...FONTS.header, fontSize: 48, marginBottom: 4 },
  progressSubtitle: { ...FONTS.body, fontWeight: "500" },
  kpiGrid: { marginBottom: 24 },
  kpiRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  adjustBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: SIZES.radius,
    marginBottom: 40,
  },
  adjustBtnText: { ...FONTS.body, fontWeight: "600", marginLeft: 8 },
});
