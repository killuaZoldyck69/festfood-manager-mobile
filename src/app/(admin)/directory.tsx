import { FONTS, SIZES } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { apiClient } from "@/utils/apiClient";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface Attendee {
  id: string;
  name: string;
  university: string;
  role: string;
  category: string;
  qrToken: string;
  foodClaimed: boolean;
  claimedAt: string | null;
  createdAt: string;
  updatedAt: string;
  scannerName?: string | null;
  scannerRole?: string | null;
}

interface MetaData {
  totalAttendees: number;
  currentPage: number;
  totalPages: number;
  hasMore: boolean;
  currentFilter?: string;
}

type FilterTab = "ALL" | "CLAIMED" | "PENDING";

const formatTime = (isoString: string | null) => {
  if (!isoString) return "";
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const formatDateTime = (isoString: string | null) => {
  if (!isoString) return "Unknown Date";
  const date = new Date(isoString);
  const datePart = date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const timePart = date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${datePart} at ${timePart}`;
};

export default function AdminDirectoryScreen() {
  const theme = useTheme();

  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [meta, setMeta] = useState<MetaData | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("ALL");

  const [selectedAttendee, setSelectedAttendee] = useState<Attendee | null>(
    null,
  );
  const [claimConfirmAttendee, setClaimConfirmAttendee] =
    useState<Attendee | null>(null);

  // 🔴 NEW: State to manage our custom error/alert modal
  const [errorModalInfo, setErrorModalInfo] = useState<{
    title: string;
    message: string;
    type: "OUT_OF_STOCK" | "ERROR";
  } | null>(null);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);

      const delayDebounceFn = setTimeout(() => {
        fetchAttendees(1, searchQuery, activeTab);
      }, 500);

      return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, activeTab]),
  );

  const fetchAttendees = async (
    pageNumber: number,
    currentSearch: string,
    currentTab: FilterTab,
  ) => {
    setIsLoading(true);
    try {
      let url = `/admin/attendees?search=${encodeURIComponent(currentSearch)}&page=${pageNumber}&limit=25`;

      if (currentTab !== "ALL") {
        url += `&status=${currentTab}`;
      }

      const response = await apiClient(url, { method: "GET" });

      if (response.ok) {
        const data = await response.json();

        let fetchedAttendees = [];
        let fetchedMeta = data.meta || null;

        if (Array.isArray(data)) fetchedAttendees = data;
        else if (data && Array.isArray(data.data)) fetchedAttendees = data.data;
        else if (data && Array.isArray(data.attendees))
          fetchedAttendees = data.attendees;

        if (
          fetchedAttendees.length > 10 &&
          (!fetchedMeta || fetchedMeta.totalPages === 1)
        ) {
          const startIndex = (pageNumber - 1) * 10;
          const endIndex = startIndex + 10;

          fetchedMeta = {
            totalAttendees: fetchedAttendees.length,
            currentPage: pageNumber,
            totalPages: Math.ceil(fetchedAttendees.length / 10),
            hasMore: endIndex < fetchedAttendees.length,
            currentFilter: currentTab,
          };
          fetchedAttendees = fetchedAttendees.slice(startIndex, endIndex);
        }

        setAttendees(fetchedAttendees);
        setMeta(fetchedMeta);
      }
    } catch (error) {
      console.error("Failed to fetch directory:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (tab: FilterTab) => {
    setIsLoading(true);
    setActiveTab(tab);
    setAttendees([]);
    setMeta(null);
  };

  const handleManualClaim = async () => {
    if (!claimConfirmAttendee) return;

    const attendeeId = claimConfirmAttendee.id;
    const previousAttendees = [...attendees];

    setClaimConfirmAttendee(null);

    const now = new Date().toISOString();
    setAttendees((prev) =>
      prev.map((attendee) =>
        attendee.id === attendeeId
          ? {
              ...attendee,
              foodClaimed: true,
              claimedAt: now,
              scannerName: "Manual Override",
              scannerRole: "ADMIN",
            }
          : attendee,
      ),
    );

    try {
      const response = await apiClient("/admin/override", {
        method: "POST",
        body: JSON.stringify({ attendeeId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errMsg = (
          errorData.message ||
          errorData.error ||
          ""
        ).toUpperCase();

        if (
          errMsg.includes("NO FOOD") ||
          errMsg.includes("INVENTORY") ||
          errMsg.includes("DEPLETED")
        ) {
          throw new Error("OUT_OF_STOCK");
        }
        throw new Error("Failed to process manual override.");
      }
    } catch (error: any) {
      setAttendees(previousAttendees);

      // 🔴 UPDATED: Trigger the custom modal instead of Alert.alert
      if (error.message === "OUT_OF_STOCK") {
        setErrorModalInfo({
          title: "Out of Stock",
          message:
            "There is no food left in the inventory! Please increase the total available food from your Dashboard before claiming more tickets.",
          type: "OUT_OF_STOCK",
        });
      } else {
        setErrorModalInfo({
          title: "Override Failed",
          message:
            "Could not mark attendee as claimed. Please check your connection and try again.",
          type: "ERROR",
        });
      }
    }
  };

  const safeAttendees = Array.isArray(attendees) ? attendees : [];

  const renderAttendee = ({ item }: { item: Attendee }) => {
    const isClaimed = item.foodClaimed;

    return (
      <TouchableOpacity
        style={[styles.listItem, { borderBottomColor: theme.border }]}
        activeOpacity={0.7}
        onPress={() => setSelectedAttendee(item)}
      >
        <View style={styles.listLeft}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: isClaimed ? theme.success : theme.textMuted },
            ]}
          />
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text
              style={[styles.attendeeName, { color: theme.textMain }]}
              numberOfLines={1}
            >
              {item.name}
            </Text>

            <View style={styles.listSubRow}>
              <Text
                style={[styles.attendeeUniversity, { color: theme.textMuted }]}
                numberOfLines={1}
              >
                {item.university || "Unknown University"}
              </Text>
            </View>

            <View
              style={[
                styles.categoryBadge,
                { backgroundColor: `${theme.primary}15` },
              ]}
            >
              <Text
                style={[styles.categoryBadgeText, { color: theme.primary }]}
              >
                {item.category || "Participant"}
              </Text>
            </View>
          </View>
        </View>

        {isClaimed ? (
          <Text style={[styles.timeText, { color: theme.textMuted }]}>
            {formatTime(item.claimedAt)}
          </Text>
        ) : (
          <TouchableOpacity
            style={[
              styles.manualClaimBtn,
              { borderColor: theme.border, backgroundColor: theme.surface },
            ]}
            onPress={() => setClaimConfirmAttendee(item)}
          >
            <Text style={[styles.manualClaimText, { color: theme.primary }]}>
              Manual Claim
            </Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.surface }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.primary }]}>
          Attendee Directory
        </Text>
        {meta && (
          <Text style={[styles.totalLogs, { color: theme.textMuted }]}>
            {meta.totalAttendees}{" "}
            {activeTab === "ALL"
              ? "Registered"
              : activeTab === "CLAIMED"
                ? "Claimed"
                : "Pending"}
          </Text>
        )}
      </View>

      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View
          style={[styles.searchContainer, { backgroundColor: theme.surface }]}
        >
          <Feather
            name="search"
            size={20}
            color={theme.textMuted}
            style={styles.searchIcon}
          />
          <TextInput
            style={[styles.searchInput, { color: theme.textMain }]}
            placeholder="Search by Name, ID, or University..."
            placeholderTextColor={theme.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View
          style={[styles.tabsContainer, { backgroundColor: theme.surface }]}
        >
          {(["ALL", "CLAIMED", "PENDING"] as FilterTab[]).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.tab,
                  isActive && {
                    backgroundColor: theme.background,
                    shadowColor: "#000",
                    elevation: 2,
                    shadowOpacity: 0.1,
                    shadowOffset: { width: 0, height: 1 },
                  },
                ]}
                onPress={() => handleTabChange(tab)}
              >
                <Text
                  style={[
                    styles.tabText,
                    {
                      color: isActive ? theme.primary : theme.textMuted,
                      fontWeight: isActive ? "700" : "500",
                    },
                  ]}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <FlatList
          data={safeAttendees}
          keyExtractor={(item) => item.id}
          renderItem={renderAttendee}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.centerContent}>
              {isLoading ? (
                <ActivityIndicator
                  size="large"
                  color={theme.primary}
                  style={{ marginTop: 60 }}
                />
              ) : (
                <Text
                  style={{
                    color: theme.textMuted,
                    marginTop: 60,
                    ...FONTS.body,
                  }}
                >
                  No attendees found.
                </Text>
              )}
            </View>
          }
          ListFooterComponent={
            safeAttendees.length > 0 && meta && meta.totalPages > 1 ? (
              <View style={styles.paginationWrapper}>
                <TouchableOpacity
                  style={[
                    styles.pageBtn,
                    meta.currentPage === 1 && styles.pageBtnDisabled,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                    },
                  ]}
                  disabled={meta.currentPage === 1 || isLoading}
                  onPress={() =>
                    fetchAttendees(meta.currentPage - 1, searchQuery, activeTab)
                  }
                >
                  <Feather
                    name="chevron-left"
                    size={20}
                    color={
                      meta.currentPage === 1 ? theme.textMuted : theme.primary
                    }
                  />
                  <Text
                    style={[
                      styles.pageBtnText,
                      {
                        color:
                          meta.currentPage === 1
                            ? theme.textMuted
                            : theme.primary,
                        marginLeft: 4,
                      },
                    ]}
                  >
                    Prev
                  </Text>
                </TouchableOpacity>

                <Text style={[styles.pageIndicator, { color: theme.textMain }]}>
                  Page {meta.currentPage} of {meta.totalPages}
                </Text>

                <TouchableOpacity
                  style={[
                    styles.pageBtn,
                    !meta.hasMore && styles.pageBtnDisabled,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                    },
                  ]}
                  disabled={!meta.hasMore || isLoading}
                  onPress={() =>
                    fetchAttendees(meta.currentPage + 1, searchQuery, activeTab)
                  }
                >
                  <Text
                    style={[
                      styles.pageBtnText,
                      {
                        color: !meta.hasMore ? theme.textMuted : theme.primary,
                        marginRight: 4,
                      },
                    ]}
                  >
                    Next
                  </Text>
                  <Feather
                    name="chevron-right"
                    size={20}
                    color={!meta.hasMore ? theme.textMuted : theme.primary}
                  />
                </TouchableOpacity>
              </View>
            ) : null
          }
        />
      </View>

      {/* Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={!!claimConfirmAttendee}
        onRequestClose={() => setClaimConfirmAttendee(null)}
      >
        <View style={styles.centerModalOverlay}>
          <View
            style={[
              styles.confirmModalCard,
              { backgroundColor: theme.background },
            ]}
          >
            <View
              style={[
                styles.warningIconBg,
                { backgroundColor: `${theme.primary}15` },
              ]}
            >
              <Feather name="alert-circle" size={32} color={theme.primary} />
            </View>

            <Text style={[styles.confirmModalTitle, { color: theme.textMain }]}>
              Manual Override
            </Text>

            <Text style={[styles.confirmModalText, { color: theme.textMuted }]}>
              Are you sure you want to mark{" "}
              <Text style={{ color: theme.textMain, fontWeight: "700" }}>
                {claimConfirmAttendee?.name}
              </Text>
              's ticket as claimed?
            </Text>

            <View style={styles.confirmModalActions}>
              <TouchableOpacity
                style={[
                  styles.confirmBtn,
                  styles.cancelBtn,
                  { borderColor: theme.border },
                ]}
                onPress={() => setClaimConfirmAttendee(null)}
              >
                <Text style={[styles.cancelBtnText, { color: theme.textMain }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.confirmBtn,
                  styles.acceptBtn,
                  { backgroundColor: theme.primary },
                ]}
                onPress={handleManualClaim}
              >
                <Text style={styles.acceptBtnText}>Confirm Claim</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 🔴 NEW: Custom Error & Out of Stock Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={!!errorModalInfo}
        onRequestClose={() => setErrorModalInfo(null)}
      >
        <View style={styles.centerModalOverlay}>
          <View
            style={[
              styles.confirmModalCard,
              { backgroundColor: theme.background },
            ]}
          >
            <View
              style={[
                styles.warningIconBg,
                {
                  // If it's an Out of Stock error, match the slate color from the scanner
                  backgroundColor:
                    errorModalInfo?.type === "OUT_OF_STOCK"
                      ? "#334155"
                      : `${theme.error}15`,
                },
              ]}
            >
              <Feather
                name={
                  errorModalInfo?.type === "OUT_OF_STOCK"
                    ? "inbox"
                    : "alert-triangle"
                }
                size={32}
                color={
                  errorModalInfo?.type === "OUT_OF_STOCK" ? "#FFF" : theme.error
                }
              />
            </View>

            <Text
              style={[
                styles.confirmModalTitle,
                { color: theme.textMain, textAlign: "center" },
              ]}
            >
              {errorModalInfo?.title}
            </Text>

            <Text
              style={[
                styles.confirmModalText,
                { color: theme.textMuted, marginBottom: 32 },
              ]}
            >
              {errorModalInfo?.message}
            </Text>

            <TouchableOpacity
              style={[
                styles.confirmBtn,
                {
                  backgroundColor:
                    errorModalInfo?.type === "OUT_OF_STOCK"
                      ? "#334155"
                      : theme.error,
                  width: "100%",
                },
              ]}
              onPress={() => setErrorModalInfo(null)}
            >
              <Text style={styles.acceptBtnText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Attendee Details Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={!!selectedAttendee}
        onRequestClose={() => setSelectedAttendee(null)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={() => setSelectedAttendee(null)}
          />
          <View
            style={[styles.modalContent, { backgroundColor: theme.background }]}
          >
            <View style={styles.dragHandle} />

            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.textMain }]}>
                Attendee Details
              </Text>
              <TouchableOpacity onPress={() => setSelectedAttendee(null)}>
                <View
                  style={[styles.closeBtn, { backgroundColor: theme.surface }]}
                >
                  <Feather name="x" size={20} color={theme.textMain} />
                </View>
              </TouchableOpacity>
            </View>

            {selectedAttendee && (
              <>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: selectedAttendee.foodClaimed
                        ? `${theme.success}15`
                        : `${theme.textMuted}15`,
                      borderColor: selectedAttendee.foodClaimed
                        ? theme.success
                        : theme.textMuted,
                    },
                  ]}
                >
                  <Feather
                    name={
                      selectedAttendee.foodClaimed ? "check-circle" : "clock"
                    }
                    size={16}
                    color={
                      selectedAttendee.foodClaimed
                        ? theme.success
                        : theme.textMuted
                    }
                  />
                  <Text
                    style={[
                      styles.statusBadgeText,
                      {
                        color: selectedAttendee.foodClaimed
                          ? theme.success
                          : theme.textMuted,
                      },
                    ]}
                  >
                    {selectedAttendee.foodClaimed
                      ? "ALREADY CLAIMED"
                      : "PENDING CLAIM"}
                  </Text>
                </View>

                <Text style={[styles.detailName, { color: theme.textMain }]}>
                  {selectedAttendee.name}
                </Text>
                <Text
                  style={[styles.detailUniversity, { color: theme.textMuted }]}
                >
                  {selectedAttendee.university || "Unknown University"}
                </Text>

                <View style={styles.modalMetaRow}>
                  <View
                    style={[
                      styles.modalCategoryBadge,
                      { backgroundColor: `${theme.primary}15` },
                    ]}
                  >
                    <Text
                      style={[
                        styles.modalCategoryText,
                        { color: theme.primary },
                      ]}
                    >
                      {selectedAttendee.category || "Participant"}
                    </Text>
                  </View>
                  <Text
                    style={[styles.modalIdText, { color: theme.textMuted }]}
                  >
                    ID: #{selectedAttendee.id.substring(0, 8).toUpperCase()}
                  </Text>
                </View>

                <Text style={[styles.auditTitle, { color: theme.textMuted }]}>
                  AUDIT TRAIL
                </Text>
                <View style={styles.auditContainer}>
                  <View style={styles.auditNode}>
                    <View style={styles.auditTimeline}>
                      <View
                        style={[
                          styles.auditDot,
                          { backgroundColor: `${theme.primary}50` },
                        ]}
                      />
                      <View
                        style={[
                          styles.auditLine,
                          { backgroundColor: `${theme.primary}20` },
                        ]}
                      />
                    </View>
                    <View style={styles.auditDetails}>
                      <Text
                        style={[styles.auditTime, { color: theme.textMain }]}
                      >
                        {formatDateTime(selectedAttendee.createdAt)}
                      </Text>
                      <Text
                        style={[styles.auditDesc, { color: theme.textMuted }]}
                      >
                        Registered in System
                      </Text>
                    </View>
                  </View>

                  {selectedAttendee.foodClaimed && (
                    <View style={styles.auditNode}>
                      <View style={styles.auditTimeline}>
                        <View
                          style={[
                            styles.auditDot,
                            { backgroundColor: theme.primary },
                          ]}
                        />
                      </View>
                      <View style={styles.auditDetails}>
                        <Text
                          style={[styles.auditTime, { color: theme.textMain }]}
                        >
                          {formatDateTime(selectedAttendee.claimedAt)}
                        </Text>
                        <Text
                          style={[styles.auditDesc, { color: theme.textMuted }]}
                        >
                          Scanned by{" "}
                          {selectedAttendee.scannerRole === "ADMIN"
                            ? "Admin"
                            : "Volunteer"}
                          :{" "}
                          <Text
                            style={{ color: theme.primary, fontWeight: "600" }}
                          >
                            {selectedAttendee.scannerName || "System"}
                          </Text>
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// -----------------------------------------------------
// STYLES
// -----------------------------------------------------
const styles = StyleSheet.create({
  safeArea: { flex: 1, paddingTop: Platform.OS === "android" ? 40 : 16 },
  container: { flex: 1 },
  centerContent: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SIZES.padding,
    paddingVertical: 16,
  },
  headerTitle: { ...FONTS.header, fontSize: 28 },
  totalLogs: { ...FONTS.body, fontWeight: "600" },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: SIZES.padding,
    marginTop: 8,
    borderRadius: SIZES.radius,
    paddingHorizontal: 16,
    height: 50,
  },
  searchIcon: { marginRight: 12 },
  searchInput: { flex: 1, ...FONTS.body, fontSize: 16, height: "100%" },

  tabsContainer: {
    flexDirection: "row",
    marginHorizontal: SIZES.padding,
    marginTop: 16,
    borderRadius: SIZES.radius,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: SIZES.radius - 4,
  },
  tabText: { ...FONTS.body, fontSize: 13, letterSpacing: 0.5 },

  listContent: {
    paddingHorizontal: SIZES.padding,
    paddingTop: 16,
    paddingBottom: 100,
  },
  listItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  listLeft: { flexDirection: "row", alignItems: "flex-start", flex: 1 },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 16,
    marginTop: 6,
  },

  attendeeName: {
    ...FONTS.body,
    fontWeight: "700",
    fontSize: 16,
    marginBottom: 4,
  },
  listSubRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  attendeeUniversity: { ...FONTS.muted, fontSize: 13, flexShrink: 1 },

  categoryBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryBadgeText: {
    ...FONTS.body,
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
  },

  timeText: { ...FONTS.muted, fontSize: 13, fontWeight: "600" },
  manualClaimBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  manualClaimText: { ...FONTS.body, fontSize: 12, fontWeight: "700" },

  paginationWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 24,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
    marginTop: 8,
  },
  pageBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: SIZES.radius,
    borderWidth: 1,
  },
  pageBtnDisabled: { opacity: 0.5 },
  pageBtnText: { ...FONTS.body, fontWeight: "700", fontSize: 14 },
  pageIndicator: { ...FONTS.body, fontWeight: "600", fontSize: 14 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: SIZES.padding,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
    minHeight: "55%",
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#E2E8F0",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 24,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: { ...FONTS.header, fontSize: 20 },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  statusBadgeText: {
    ...FONTS.body,
    fontWeight: "700",
    fontSize: 12,
    marginLeft: 6,
    letterSpacing: 0.5,
  },

  detailName: { ...FONTS.header, fontSize: 28, marginBottom: 6 },
  detailUniversity: {
    ...FONTS.body,
    fontSize: 16,
    marginBottom: 16,
    lineHeight: 22,
  },

  modalMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 32,
  },
  modalCategoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 12,
  },
  modalCategoryText: {
    ...FONTS.body,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  modalIdText: {
    ...FONTS.body,
    fontSize: 13,
    fontWeight: "600",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },

  auditTitle: {
    ...FONTS.muted,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 16,
  },
  auditContainer: { marginLeft: 8 },
  auditNode: { flexDirection: "row", marginBottom: 4 },
  auditTimeline: { alignItems: "center", width: 20, marginRight: 16 },
  auditDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  auditLine: { width: 2, flex: 1, marginVertical: 4 },
  auditDetails: { flex: 1, paddingBottom: 24 },
  auditTime: {
    ...FONTS.body,
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  auditDesc: { ...FONTS.body, fontSize: 14, lineHeight: 20 },

  centerModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: SIZES.padding,
  },
  confirmModalCard: {
    width: "100%",
    padding: 24,
    borderRadius: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  warningIconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  confirmModalTitle: { ...FONTS.header, fontSize: 22, marginBottom: 8 },
  confirmModalText: {
    ...FONTS.body,
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  confirmModalActions: { flexDirection: "row", width: "100%", gap: 12 },
  confirmBtn: {
    flex: 1,
    height: 50,
    borderRadius: SIZES.radius,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelBtn: { borderWidth: 1 },
  acceptBtn: {},
  cancelBtnText: { ...FONTS.body, fontWeight: "600", fontSize: 15 },
  acceptBtnText: {
    color: "#FFF",
    ...FONTS.body,
    fontWeight: "700",
    fontSize: 15,
  },
});
