// app/(volunteer)/dashboard.tsx
import { FONTS, SIZES } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/hooks/use-theme";
import { apiClient } from "@/utils/apiClient";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface InventoryStats {
  available: number;
  served: number;
  duplicates: number;
  invalid: number;
}

const MOCK_STATS: InventoryStats = {
  available: 0,
  served: 0,
  duplicates: 0,
  invalid: 0,
};

export default function VolunteerDashboardScreen() {
  const theme = useTheme();
  const { signOut } = useAuth();

  const [stats, setStats] = useState<InventoryStats>(MOCK_STATS);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch the live global stats so volunteers can see how the event is going
  const fetchInventory = async () => {
    try {
      const response = await apiClient("/inventory", { method: "GET" });

      if (response.ok) {
        const data = await response.json();
        setStats({
          available:
            data?.available ?? data?.totalAvailable ?? MOCK_STATS.available,
          served: data?.served ?? data?.totalServed ?? MOCK_STATS.served,
          duplicates:
            data?.duplicates ?? data?.duplicateScans ?? MOCK_STATS.duplicates,
          invalid: data?.invalid ?? data?.invalidTickets ?? MOCK_STATS.invalid,
        });
      } else {
        setStats(MOCK_STATS);
      }
    } catch (error) {
      console.error("Failed to fetch inventory:", error);
      setStats(MOCK_STATS);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchInventory();
    }, []),
  );

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchInventory();
  };

  const totalActioned = (stats?.served ?? 0) + (stats?.available ?? 0);
  const progressPercentage =
    totalActioned === 0
      ? 0
      : Math.round(((stats?.served ?? 0) / totalActioned) * 100);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Feather
            name="grid"
            size={24}
            color={theme.primary}
            style={{ marginRight: 12 }}
          />
          <View>
            <Text style={[styles.headerTitle, { color: theme.primary }]}>
              Event Command
            </Text>
            <Text style={[styles.headerTitle, { color: theme.primary }]}>
              Center
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          {/* 🔴 Changed Badge from ADMIN to VOLUNTEER */}
          <View
            style={[styles.volunteerBadge, { backgroundColor: theme.primary }]}
          >
            <Text style={styles.volunteerBadgeText}>VOLUNTEER</Text>
          </View>
          <TouchableOpacity onPress={signOut} style={styles.logoutBtn}>
            <Feather name="log-out" size={24} color={theme.textMain} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
          />
        }
      >
        {isLoading ? (
          <ActivityIndicator
            size="large"
            color={theme.primary}
            style={{ marginTop: 40 }}
          />
        ) : (
          <>
            <View style={[styles.heroCard, { backgroundColor: theme.surface }]}>
              <View
                style={[
                  styles.progressRingWrapper,
                  { borderColor: `${theme.primary}20` },
                ]}
              >
                <View
                  style={[styles.progressRing, { borderColor: theme.primary }]}
                >
                  <Text
                    style={[styles.progressValue, { color: theme.textMain }]}
                  >
                    {progressPercentage}%
                  </Text>
                  <Text
                    style={[styles.progressLabel, { color: theme.textMuted }]}
                  >
                    Food Claimed
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.grid}>
              <View
                style={[styles.gridCard, { backgroundColor: theme.surface }]}
              >
                <Text style={[styles.gridTitle, { color: theme.textMuted }]}>
                  Total Available
                </Text>
                <Text style={[styles.gridValue, { color: theme.textMain }]}>
                  {stats?.available ?? 0}
                </Text>
              </View>

              <View
                style={[styles.gridCard, { backgroundColor: theme.surface }]}
              >
                <Text style={[styles.gridTitle, { color: theme.textMuted }]}>
                  Total Served
                </Text>
                <Text style={[styles.gridValue, { color: theme.success }]}>
                  {stats?.served ?? 0}
                </Text>
              </View>

              <View
                style={[styles.gridCard, { backgroundColor: theme.surface }]}
              >
                <Text style={[styles.gridTitle, { color: theme.error }]}>
                  Duplicate Scans
                </Text>
                <Text style={[styles.gridValue, { color: theme.error }]}>
                  {stats?.duplicates ?? 0}
                </Text>
              </View>

              <View
                style={[styles.gridCard, { backgroundColor: theme.surface }]}
              >
                <Text style={[styles.gridTitle, { color: "#F59E0B" }]}>
                  Invalid Tickets
                </Text>
                <Text style={[styles.gridValue, { color: "#F59E0B" }]}>
                  {stats?.invalid ?? 0}
                </Text>
              </View>
            </View>

            {/* 🔴 Removed the Adjust Inventory Button and Modal */}

            <View style={{ height: 100 }} />
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 48 },
  scrollContent: { paddingHorizontal: SIZES.padding },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: SIZES.padding,
    marginBottom: 24,
  },
  headerLeft: { flexDirection: "row", alignItems: "center" },
  headerTitle: { ...FONTS.header, fontSize: 24, lineHeight: 28 },
  headerRight: { flexDirection: "row", alignItems: "center" },

  // Custom Volunteer Badge Styling
  volunteerBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    marginRight: 12,
  },
  volunteerBadgeText: {
    color: "#FFF",
    ...FONTS.body,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
  },

  logoutBtn: { padding: 4 },
  heroCard: {
    padding: 32,
    borderRadius: SIZES.radius,
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  progressRingWrapper: {
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  progressRing: {
    width: "100%",
    height: "100%",
    borderRadius: 110,
    borderWidth: 12,
    justifyContent: "center",
    alignItems: "center",
    borderTopColor: "transparent",
    borderRightColor: "transparent",
    transform: [{ rotate: "-45deg" }],
  },
  progressValue: {
    ...FONTS.header,
    fontSize: 48,
    transform: [{ rotate: "45deg" }],
    marginTop: 20,
  },
  progressLabel: {
    ...FONTS.body,
    fontSize: 14,
    fontWeight: "500",
    transform: [{ rotate: "45deg" }],
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  gridCard: {
    width: "48%",
    padding: 20,
    borderRadius: SIZES.radius,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  gridTitle: {
    ...FONTS.body,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
  },
  gridValue: { ...FONTS.header, fontSize: 28 },
});
