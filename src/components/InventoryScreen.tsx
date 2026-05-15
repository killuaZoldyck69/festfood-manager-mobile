import { FONTS, SIZES } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/hooks/use-theme";
import { apiClient } from "@/utils/apiClient";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface InventoryStats {
  participants: number;
  available: number;
  served: number;
  duplicates: number;
  invalid: number;
}

const MOCK_STATS: InventoryStats = {
  participants: 0,
  available: 0,
  served: 0,
  duplicates: 0,
  invalid: 0,
};

interface InventoryScreenProps {
  role: "ADMIN" | "VOLUNTEER";
}

export default function InventoryScreen({ role }: InventoryScreenProps) {
  const theme = useTheme();
  const { user, signOut } = useAuth();

  const { width: screenWidth } = useWindowDimensions();

  const [stats, setStats] = useState<InventoryStats>(MOCK_STATS);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [isUpdating, setIsUpdating] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [inventoryInput, setInventoryInput] = useState("0");

  const fetchInventory = async () => {
    try {
      const response = await apiClient("/inventory", { method: "GET" });
      if (response.ok) {
        const data = await response.json();
        setStats({
          participants:
            data?.participants ??
            data?.totalParticipants ??
            MOCK_STATS.participants,
          available:
            data?.available ?? data?.totalAvailable ?? MOCK_STATS.available,
          served: data?.served ?? data?.totalServed ?? MOCK_STATS.served,
          duplicates:
            data?.duplicates ?? data?.duplicateScans ?? MOCK_STATS.duplicates,
          invalid: data?.invalid ?? data?.invalidTickets ?? MOCK_STATS.invalid,
        });
      }
    } catch (error) {
      console.error("Failed to fetch inventory:", error);
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

  const openModal = () => {
    setInventoryInput((stats?.available ?? 0).toString());
    setIsModalVisible(true);
  };

  const adjustInventory = (amount: number) => {
    const currentVal = parseInt(inventoryInput) || 0;
    const newVal = Math.max(0, currentVal + amount);
    setInventoryInput(newVal.toString());
  };

  const submitInventoryUpdate = async () => {
    const newValue = parseInt(inventoryInput);
    if (isNaN(newValue)) return;

    setIsUpdating(true);
    const previousAvailable = stats.available;
    setStats((prev) => ({ ...prev, available: newValue }));
    setIsModalVisible(false);

    try {
      const response = await apiClient("/admin/inventory", {
        method: "PUT",
        body: JSON.stringify({ totalAvailable: newValue }),
      });

      if (!response.ok) throw new Error("Failed to update inventory.");
    } catch (error) {
      Alert.alert(
        "Update Failed",
        "Could not reach the server. Reverting value.",
      );
      setStats((prev) => ({ ...prev, available: previousAvailable }));
    } finally {
      setIsUpdating(false);
    }
  };

  const totalActioned = (stats?.served ?? 0) + (stats?.available ?? 0);
  const progressPercentage =
    totalActioned === 0
      ? 0
      : Math.round(((stats?.served ?? 0) / totalActioned) * 100);

  // Responsive calculations
  const ringSize = Math.min(screenWidth * 0.55, 260);
  const ringBorderWidth = ringSize * 0.07;

  return (
    <SafeAreaView
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
          {/* 🔴 Unified Name + Role Pill */}
          <View
            style={[styles.userPill, { backgroundColor: `${theme.primary}15` }]}
          >
            <Text
              style={[styles.userName, { color: theme.primary }]}
              numberOfLines={1}
            >
              {user?.name || "Md. Nahid"}
            </Text>
            <View
              style={[styles.roleBadge, { backgroundColor: theme.primary }]}
            >
              <Text style={styles.roleBadgeText}>{role}</Text>
            </View>
          </View>

          {/* 🔴 Red Logout Icon */}
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
            {/* Responsive Hero Progress Ring */}
            <View style={[styles.heroCard, { backgroundColor: theme.surface }]}>
              <View
                style={[
                  styles.progressRingWrapper,
                  {
                    width: ringSize,
                    height: ringSize,
                    borderRadius: ringSize / 2,
                    borderWidth: ringBorderWidth * 0.7,
                    borderColor: `${theme.primary}20`,
                  },
                ]}
              >
                <View
                  style={[
                    styles.progressRing,
                    {
                      width: "100%",
                      height: "100%",
                      borderRadius: ringSize / 2,
                      borderWidth: ringBorderWidth,
                      borderColor: theme.primary,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.progressValue,
                      { color: theme.textMain, fontSize: ringSize * 0.22 },
                    ]}
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

            {/* 🔴 New Full-Width Participant Card */}
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
                  {stats?.participants ?? 0}
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

            {role === "ADMIN" && (
              <TouchableOpacity
                style={[
                  styles.adjustBtn,
                  { borderColor: theme.border, backgroundColor: theme.surface },
                ]}
                activeOpacity={0.7}
                onPress={openModal}
              >
                <Feather name="sliders" size={20} color={theme.primary} />
                <Text style={[styles.adjustBtnText, { color: theme.primary }]}>
                  Adjust Total Inventory
                </Text>
              </TouchableOpacity>
            )}

            <View style={{ height: 100 }} />
          </>
        )}
      </ScrollView>

      {/* Admin Adjustment Modal */}
      {role === "ADMIN" && (
        <Modal
          animationType="fade"
          transparent={true}
          visible={isModalVisible}
          onRequestClose={() => setIsModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <TouchableOpacity
              style={StyleSheet.absoluteFillObject}
              activeOpacity={1}
              onPress={() => setIsModalVisible(false)}
            />
            <View
              style={[
                styles.modalContent,
                { backgroundColor: theme.background },
              ]}
            >
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.textMain }]}>
                  Update Logistics
                </Text>
                <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                  <Feather name="x" size={24} color={theme.textMain} />
                </TouchableOpacity>
              </View>

              <View
                style={[
                  styles.readOnlyRow,
                  { backgroundColor: `${theme.primary}05` },
                ]}
              >
                <Text
                  style={[styles.readOnlyLabel, { color: theme.textMuted }]}
                >
                  Current Available
                </Text>
                <Text style={[styles.readOnlyValue, { color: theme.primary }]}>
                  {stats?.available ?? 0}
                </Text>
              </View>

              <Text style={[styles.inputLabel, { color: theme.textMain }]}>
                Total Inventory Target
              </Text>
              <View style={styles.inputRow}>
                <TouchableOpacity
                  style={[
                    styles.adjustCircle,
                    { backgroundColor: theme.surface },
                  ]}
                  onPress={() => adjustInventory(-10)}
                >
                  <Text
                    style={[styles.adjustCircleText, { color: theme.textMain }]}
                  >
                    -10
                  </Text>
                </TouchableOpacity>
                <TextInput
                  style={[
                    styles.numberInput,
                    {
                      backgroundColor: theme.surface,
                      color: theme.textMain,
                      borderColor: theme.border,
                    },
                  ]}
                  keyboardType="number-pad"
                  value={inventoryInput}
                  onChangeText={setInventoryInput}
                  textAlign="center"
                />
                <TouchableOpacity
                  style={[
                    styles.adjustCircle,
                    { backgroundColor: theme.surface },
                  ]}
                  onPress={() => adjustInventory(10)}
                >
                  <Text
                    style={[styles.adjustCircleText, { color: theme.textMain }]}
                  >
                    +10
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  { backgroundColor: theme.primary },
                  isUpdating && { opacity: 0.7 },
                ]}
                activeOpacity={0.8}
                onPress={submitInventoryUpdate}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.submitBtnText}>Update Inventory</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, paddingTop: Platform.OS === "android" ? 40 : 16 },
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: SIZES.padding },

  // Headers
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
  userName: {
    ...FONTS.body,
    fontSize: 13,
    fontWeight: "700",
    marginRight: 8,
    flexShrink: 1,
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  roleBadgeText: {
    color: "#FFF",
    ...FONTS.body,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  logoutBtn: { padding: 4 },

  // Hero Card
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
    justifyContent: "center",
    alignItems: "center",
  },
  progressRing: {
    justifyContent: "center",
    alignItems: "center",
    borderTopColor: "transparent",
    borderRightColor: "transparent",
    transform: [{ rotate: "-45deg" }],
  },
  progressValue: {
    ...FONTS.header,
    transform: [{ rotate: "45deg" }],
    marginTop: 12,
  },
  progressLabel: {
    ...FONTS.body,
    fontSize: 14,
    fontWeight: "500",
    transform: [{ rotate: "45deg" }],
  },

  // Full Width Card
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

  // Grid Cards
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

  // Admin Adjust Button
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

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: SIZES.padding,
  },
  modalContent: { borderRadius: 24, padding: 24 },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitle: { ...FONTS.header, fontSize: 22 },
  readOnlyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: SIZES.radius,
    marginBottom: 24,
  },
  readOnlyLabel: { ...FONTS.body, fontSize: 14, fontWeight: "600" },
  readOnlyValue: { ...FONTS.header, fontSize: 20 },
  inputLabel: { ...FONTS.body, fontWeight: "600", marginBottom: 12 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 32,
  },
  adjustCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  adjustCircleText: { ...FONTS.body, fontWeight: "700", fontSize: 18 },
  numberInput: {
    flex: 1,
    marginHorizontal: 16,
    height: 50,
    borderWidth: 1,
    borderRadius: SIZES.radius,
    ...FONTS.header,
    fontSize: 20,
  },
  submitBtn: {
    height: 56,
    borderRadius: SIZES.radius,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  submitBtnText: {
    color: "#FFF",
    ...FONTS.body,
    fontWeight: "700",
    fontSize: 16,
    letterSpacing: 0.5,
  },
});
