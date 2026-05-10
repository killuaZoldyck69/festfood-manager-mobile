// app/(admin)/dashboard.tsx
import { FONTS, SIZES } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/hooks/use-theme";
import { apiClient } from "@/utils/apiClient";
import { Feather } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
  available: 500,
  served: 375,
  duplicates: 12,
  invalid: 3,
};

export default function AdminDashboardScreen() {
  const theme = useTheme();
  const { signOut } = useAuth();

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

  useEffect(() => {
    fetchInventory();
  }, []);

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

      if (!response.ok) {
        throw new Error(
          `Failed to update inventory. Status: ${response.status}`,
        );
      }
    } catch (error) {
      console.error("PUT Error:", error);
      Alert.alert(
        "Update Failed",
        "Could not reach the server or unauthorized. Reverting value.",
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
          <View style={[styles.adminBadge, { backgroundColor: theme.primary }]}>
            <Text style={styles.adminBadgeText}>ADMIN</Text>
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

            <TouchableOpacity
              style={[styles.adjustBtn, { borderColor: theme.primary }]}
              activeOpacity={0.7}
              onPress={openModal}
            >
              <Feather
                name="code"
                size={20}
                color={theme.primary}
                style={{ transform: [{ rotate: "90deg" }] }}
              />
              <Text style={[styles.adjustBtnText, { color: theme.primary }]}>
                Adjust Total Inventory
              </Text>
            </TouchableOpacity>

            <View style={{ height: 100 }} />
          </>
        )}
      </ScrollView>

      <Modal
        animationType="slide"
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
            style={[styles.modalContent, { backgroundColor: theme.background }]}
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
              <Text style={[styles.readOnlyLabel, { color: theme.textMuted }]}>
                Current Available
              </Text>
              <Text style={[styles.readOnlyValue, { color: theme.primary }]}>
                {stats?.available ?? 0}
              </Text>
            </View>

            <Text style={[styles.inputLabel, { color: theme.textMain }]}>
              Total Inventory
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
  adminBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    marginRight: 12,
  },
  adminBadgeText: {
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
  adjustBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 56,
    borderRadius: SIZES.radius,
    borderWidth: 2,
    marginBottom: 24,
  },
  adjustBtnText: {
    ...FONTS.body,
    fontWeight: "700",
    fontSize: 16,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitle: { ...FONTS.header, fontSize: 24 },
  readOnlyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: SIZES.radius,
    marginBottom: 24,
  },
  readOnlyLabel: { ...FONTS.body, fontSize: 14 },
  readOnlyValue: { ...FONTS.header, fontSize: 18 },
  inputLabel: { ...FONTS.body, fontWeight: "600", marginBottom: 12 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 32,
  },
  adjustCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  adjustCircleText: { ...FONTS.body, fontWeight: "700", fontSize: 16 },
  numberInput: {
    flex: 1,
    marginHorizontal: 16,
    height: 56,
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
  },
});
