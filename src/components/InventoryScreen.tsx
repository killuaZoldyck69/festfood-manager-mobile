import { Feather, Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { QUERY_KEYS } from "../constants/queryKeys";
import { FONTS, SIZES } from "../constants/theme";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../hooks/use-theme";
import { InventoryStats } from "../types";
import { apiClient } from "../utils/apiClient";
import { InventoryAdjustModal } from "./admin/InventoryAdjustModal";
import { EmptyState } from "./ui/EmptyState";

const MOCK_STATS: InventoryStats = {
  totalParticipants: 0,
  totalAvailable: 0,
  totalServed: 0,
  duplicateScans: 0,
  invalidTickets: 0,
  percentageClaimed: 0,
};

interface InventoryScreenProps {
  role: "ADMIN" | "VOLUNTEER";
}

export default function InventoryScreen({
  role,
}: InventoryScreenProps): React.ReactElement {
  const theme = useTheme();
  const { user, signOut } = useAuth();
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const animatedProgress = useRef(new Animated.Value(0)).current;

  const {
    data: stats = MOCK_STATS,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: QUERY_KEYS.inventory,
    queryFn: async () => {
      const response = await apiClient("/inventory", { method: "GET" });
      if (!response.ok) throw new Error("Failed to load inventory data");
      return (await response.json()) as InventoryStats;
    },
    refetchInterval: 10000,
  });

  const queryClient = useQueryClient();

  const updateInventoryMutation = useMutation({
    mutationFn: async (newAvailable: number) => {
      const response = await apiClient("/admin/inventory", {
        method: "PUT",
        body: JSON.stringify({ totalAvailable: newAvailable }),
      });
      if (!response.ok) throw new Error("Failed to update inventory.");
    },
    onMutate: async (newAvailable) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.inventory });
      const previousStats = queryClient.getQueryData<InventoryStats>(
        QUERY_KEYS.inventory,
      );

      if (previousStats) {
        queryClient.setQueryData<InventoryStats>(QUERY_KEYS.inventory, {
          ...previousStats,
          totalAvailable: newAvailable,
        });
      }
      return { previousStats };
    },
    onError: (err, newAvailable, context) => {
      if (context?.previousStats) {
        queryClient.setQueryData(QUERY_KEYS.inventory, context.previousStats);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.inventory });
    },
  });

  const progressPercentage =
    stats.totalParticipants === 0
      ? 0
      : Math.min(
          100,
          Math.max(
            0,
            Math.round((stats.totalServed / stats.totalParticipants) * 100),
          ),
        );

  useEffect(() => {
    Animated.timing(animatedProgress, {
      toValue: progressPercentage,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [progressPercentage]);

  const widthInterpolation = animatedProgress.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
  });

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.safeArea, { backgroundColor: theme.background }]}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerSubtitle, { color: theme.textMuted }]}>
            {new Date().toLocaleDateString(undefined, {
              weekday: "long",
              month: "short",
              day: "numeric",
            })}
          </Text>
          <Text style={[styles.headerTitle, { color: theme.textMain }]}>
            Overview
          </Text>
        </View>

        <View style={styles.headerRight}>
          <View style={styles.userInfoStack}>
            <Text
              style={[styles.userName, { color: theme.textMain }]}
              numberOfLines={1}
            >
              {user?.name || "User"}
            </Text>
            <Text
              style={[styles.userEmail, { color: theme.textMuted }]}
              numberOfLines={1}
            >
              {user?.email || "No email"}
            </Text>
            <View
              style={[
                styles.roleBadge,
                { backgroundColor: theme.primary, alignSelf: "flex-start" },
              ]}
            >
              <Text style={styles.roleBadgeText}>{role}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={signOut} style={styles.logoutBtn}>
            <Feather name="log-out" size={22} color={theme.error} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
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
        ) : error ? (
          <EmptyState icon="alert-octagon" message={error.message} />
        ) : (
          <>
            <View style={[styles.heroCard, { backgroundColor: theme.surface }]}>
              <View style={styles.heroTextRow}>
                <View>
                  <Text style={[styles.heroTitle, { color: theme.textMuted }]}>
                    Food Claimed
                  </Text>
                  <Text style={[styles.heroValue, { color: theme.textMain }]}>
                    {progressPercentage}%
                  </Text>
                </View>
                <View
                  style={[
                    styles.heroIconBadge,
                    { backgroundColor: `${theme.primary}15` },
                  ]}
                >
                  <Feather name="pie-chart" size={28} color={theme.primary} />
                </View>
              </View>

              <View
                style={[
                  styles.progressBarBg,
                  { backgroundColor: `${theme.primary}20` },
                ]}
              >
                <Animated.View
                  style={[
                    styles.progressBarFill,
                    {
                      backgroundColor: theme.primary,
                      width: widthInterpolation,
                    },
                  ]}
                />
              </View>

              <Text style={[styles.heroSubtitle, { color: theme.textMuted }]}>
                <Text style={{ color: theme.textMain, fontWeight: "700" }}>
                  {stats.totalServed}
                </Text>{" "}
                of {stats.totalParticipants} total tickets scanned
              </Text>
            </View>

            <View
              style={[styles.fullWidthCard, { backgroundColor: theme.surface }]}
            >
              <View>
                <Text style={[styles.gridTitle, { color: theme.textMuted }]}>
                  Total Participants
                </Text>
                <Text
                  style={[styles.fullWidthValue, { color: theme.textMain }]}
                >
                  {stats.totalParticipants}
                </Text>
              </View>
              <View
                style={[
                  styles.iconWrapper,
                  { backgroundColor: `${theme.primary}10` },
                ]}
              >
                <Feather name="users" size={28} color={theme.primary} />
              </View>
            </View>

            <View style={styles.grid}>
              <View
                style={[styles.gridCard, { backgroundColor: theme.surface }]}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <Text
                    style={[
                      styles.gridTitle,
                      { color: theme.textMuted, marginBottom: 0 },
                    ]}
                  >
                    Available Food
                  </Text>
                  <Ionicons
                    name="fast-food-outline"
                    size={18}
                    color={theme.textMuted}
                  />
                </View>
                <Text style={[styles.gridValue, { color: theme.textMain }]}>
                  {stats.totalAvailable}
                </Text>
              </View>

              <View
                style={[styles.gridCard, { backgroundColor: theme.surface }]}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <Text
                    style={[
                      styles.gridTitle,
                      { color: theme.textMuted, marginBottom: 0 },
                    ]}
                  >
                    Total Served
                  </Text>
                  <Feather
                    name="check-circle"
                    size={18}
                    color={theme.success}
                  />
                </View>
                <Text style={[styles.gridValue, { color: theme.success }]}>
                  {stats.totalServed}
                </Text>
              </View>

              <View
                style={[styles.gridCard, { backgroundColor: theme.surface }]}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <Text
                    style={[
                      styles.gridTitle,
                      { color: theme.error, marginBottom: 0 },
                    ]}
                  >
                    Duplicate Scans
                  </Text>
                  <Feather name="copy" size={18} color={theme.error} />
                </View>
                <Text style={[styles.gridValue, { color: theme.error }]}>
                  {stats.duplicateScans}
                </Text>
              </View>

              <View
                style={[styles.gridCard, { backgroundColor: theme.surface }]}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <Text
                    style={[
                      styles.gridTitle,
                      { color: "#F59E0B", marginBottom: 0 },
                    ]}
                  >
                    Invalid Tickets
                  </Text>
                  <Feather name="alert-triangle" size={18} color="#F59E0B" />
                </View>
                <Text style={[styles.gridValue, { color: "#F59E0B" }]}>
                  {stats.invalidTickets}
                </Text>
              </View>
            </View>

            {role === "ADMIN" && (
              <TouchableOpacity
                style={[
                  styles.adjustBtn,
                  { borderColor: theme.border, backgroundColor: theme.surface },
                ]}
                activeOpacity={0.7}
                onPress={() => setIsModalVisible(true)}
              >
                <Feather name="sliders" size={20} color={theme.primary} />
                <Text style={[styles.adjustBtnText, { color: theme.primary }]}>
                  Adjust Total Inventory
                </Text>
              </TouchableOpacity>
            )}

            <View style={styles.developerCredits}>
              <Text style={[styles.creditsText, { color: theme.textMuted }]}>
                FestFood Manager v1.0.0
              </Text>
              <View style={styles.developerRow}>
                <Text
                  style={[
                    styles.creditsText,
                    { color: theme.textMuted, marginBottom: 0 },
                  ]}
                >
                  Developed by Ghost Team
                </Text>
                <Image
                  source={require("../../assets/images/developer-icon.jpg")}
                  style={styles.developerIcon}
                  resizeMode="contain"
                />
              </View>
            </View>
            <View style={{ height: 100 }} />
          </>
        )}
      </ScrollView>

      {role === "ADMIN" && (
        <InventoryAdjustModal
          visible={isModalVisible}
          currentAvailable={stats.totalAvailable}
          onClose={() => setIsModalVisible(false)}
          onSubmit={async (val) =>
            await updateInventoryMutation.mutateAsync(val)
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, paddingTop: Platform.OS === "android" ? 40 : 16 },
  scrollContent: { paddingHorizontal: SIZES.padding },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SIZES.padding,
    marginBottom: 24,
  },
  headerLeft: { flex: 1 },
  headerSubtitle: {
    ...FONTS.body,
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  headerTitle: { ...FONTS.header, fontSize: 24 },

  headerRight: { flexDirection: "row", alignItems: "center" },
  userPill: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    paddingLeft: 12,
    paddingRight: 4,
    paddingVertical: 4,
    marginRight: 12,
    maxWidth: 160,
  },
  userInfoStack: {
    marginRight: 12,
    justifyContent: "center",
    maxWidth: 150,
  },
  userName: {
    ...FONTS.body,
    fontSize: 14,
    fontWeight: "800",
  },
  userEmail: {
    ...FONTS.body,
    fontSize: 11,
    marginBottom: 4,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  roleBadgeText: {
    color: "#FFF",
    ...FONTS.body,
    fontSize: 9,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  logoutBtn: { padding: 4 },

  heroCard: {
    padding: 24,
    borderRadius: SIZES.radius,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  heroTextRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  heroTitle: {
    ...FONTS.body,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  heroValue: {
    ...FONTS.header,
    fontSize: 48,
  },
  heroIconBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  progressBarBg: {
    height: 12,
    borderRadius: 6,
    width: "100%",
    overflow: "hidden",
    marginVertical: 20,
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 6,
    position: "absolute",
    left: 0,
    top: 0,
  },
  heroSubtitle: {
    ...FONTS.body,
    fontSize: 14,
  },

  fullWidthCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 24,
    borderRadius: SIZES.radius,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  fullWidthValue: { ...FONTS.header, fontSize: 36 },
  iconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
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

  adjustBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 56,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    marginBottom: 24,
  },
  adjustBtnText: {
    ...FONTS.body,
    fontWeight: "700",
    fontSize: 15,
    marginLeft: 10,
  },
  developerCredits: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 40,
    marginBottom: 10,
  },
  developerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  developerIcon: {
    width: 36,
    height: 36,
    marginHorizontal: 6,
    borderRadius: 36,
  },
  creditsText: {
    ...FONTS.body,
    fontSize: 12,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
});
