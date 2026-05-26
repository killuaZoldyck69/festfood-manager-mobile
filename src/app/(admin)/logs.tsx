// app/(admin)/logs.tsx
import { FONTS, SIZES } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { apiClient } from "@/utils/apiClient";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface ScanLog {
  id: string;
  status: string;
  scannedToken: string;
  scannedAt: string;
  volunteerName: string;
  attendeeName: string | null;
  volunteerRole?: string | null;
  attendeeUniversity?: string | null;
  attendeeCategory?: string | null;
  attendeeEmail?: string | null; // 🔴 NEW
  attendeeStudentId?: string | null; // 🔴 NEW
}

interface MetaData {
  totalLogs: number;
  currentPage: number;
  totalPages: number;
  hasMore: boolean;
  currentFilter?: string;
}

type FilterTab =
  | "ALL"
  | "SUCCESS"
  | "DUPLICATE"
  | "INVALID"
  | "MANUAL_OVERRIDE";

// Pre-defined event categories available for quick extraction and dropdown-pills filtering
const EVENT_CATEGORIES = [
  "ALL",
  "Gaming",
  "Hackathon",
  "Datathon",
  "Project Showcase",
  "Robotics",
  "General",
];

const formatTime = (isoString: string) => {
  const date = new Date(isoString);
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true, // 🔴 ADDED THIS LINE
  });
};

const formatDate = (isoString: string) => {
  const date = new Date(isoString);
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
};

export default function AdminLogsScreen() {
  const theme = useTheme();

  // State Management
  const [logs, setLogs] = useState<ScanLog[]>([]);
  const [meta, setMeta] = useState<MetaData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Active Filter Hooks
  const [activeTab, setActiveTab] = useState<FilterTab>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [volunteerQuery, setVolunteerQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  // State Trackers for Debounced Execution
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [debouncedVolunteer, setDebouncedVolunteer] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // 1. Debounce Manager Loop (500ms cooling window)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedVolunteer(volunteerQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [volunteerQuery]);

  // 2. Main API Query Loop triggered on debounced changes or tab variations
  useFocusEffect(
    useCallback(() => {
      fetchLogs(1);
    }, [activeTab, debouncedSearch, debouncedVolunteer, selectedCategory]),
  );

  const fetchLogs = async (pageNumber: number) => {
    setIsLoading(true);

    try {
      // Build optimized base multi-query address layout
      let url = `/admin/logs?page=${pageNumber}&limit=10`;

      if (activeTab !== "ALL") {
        url += `&status=${activeTab}`;
      }
      if (debouncedSearch.trim().length > 0) {
        url += `&search=${encodeURIComponent(debouncedSearch.trim())}`;
      }
      if (debouncedVolunteer.trim().length > 0) {
        url += `&volunteerName=${encodeURIComponent(debouncedVolunteer.trim())}`;
      }
      if (selectedCategory !== "ALL") {
        url += `&category=${encodeURIComponent(selectedCategory)}`;
      }

      const response = await apiClient(url, { method: "GET" });

      if (response.ok) {
        const responseData = await response.json();

        // 💥 THE FIX: Wrapper-Agnostic Extraction
        // If the backend wraps the response in a "data" property, unwrap it. Otherwise, use it directly.
        const payload = responseData.data ? responseData.data : responseData;

        let finalLogs = payload.logs || [];
        let finalMeta = payload.meta || null;

        // Auto-slicing fallback compliance loop
        if (
          finalLogs.length > 10 &&
          (!finalMeta || finalMeta.totalPages === 1)
        ) {
          const startIndex = (pageNumber - 1) * 10;
          const endIndex = startIndex + 10;

          finalLogs = payload.logs.slice(startIndex, endIndex);
          finalMeta = {
            totalLogs: payload.logs.length,
            currentPage: pageNumber,
            totalPages: Math.ceil(payload.logs.length / 10),
            hasMore: endIndex < payload.logs.length,
            currentFilter: activeTab,
          };
        }

        setLogs(finalLogs);
        setMeta(finalMeta);
      }
    } catch (error) {
      console.error("Failed to fetch logs execution:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (tab: FilterTab) => {
    setActiveTab(tab);
    setLogs([]);
    setMeta(null);
  };

  const getStatusVisuals = (status: string) => {
    const normalizedStatus = status.toUpperCase();

    if (
      normalizedStatus.includes("DUPLICATE") ||
      normalizedStatus.includes("ALREADY_CLAIMED")
    ) {
      return { color: theme.error, icon: "x-circle", bg: `${theme.error}15` };
    }
    if (normalizedStatus.includes("SUCCESS")) {
      return {
        color: theme.success,
        icon: "check-circle",
        bg: `${theme.success}15`,
      };
    }
    if (normalizedStatus.includes("MANUAL_OVERRIDE")) {
      return { color: theme.primary, icon: "edit-3", bg: `${theme.primary}15` };
    }

    return {
      color: "#F59E0B",
      icon: "alert-triangle",
      bg: "rgba(245,158,11,0.15)",
    };
  };

  const renderLogItem = ({ item }: { item: ScanLog }) => {
    const visual = getStatusVisuals(item.status);

    return (
      <View style={[styles.logCard, { backgroundColor: theme.surface }]}>
        <View style={styles.logHeader}>
          <View style={[styles.statusBadge, { backgroundColor: visual.bg }]}>
            <Feather name={visual.icon as any} size={14} color={visual.color} />
            <Text style={[styles.statusText, { color: visual.color }]}>
              {item.status.replace(/_/g, " ")}
            </Text>
          </View>
          <Text style={[styles.timeText, { color: theme.textMuted }]}>
            {formatDate(item.scannedAt)} • {formatTime(item.scannedAt)}
          </Text>
        </View>

        <View style={styles.logBody}>
          <View style={styles.participantInfo}>
            <Text style={[styles.label, { color: theme.textMuted }]}>
              ATTENDEE
            </Text>
            <Text
              style={[styles.attendeeName, { color: theme.textMain }]}
              numberOfLines={1}
            >
              {item.attendeeName || "Unknown / Invalid Token"}
            </Text>

            {/* 🔴 NEW: Contextual Search Trace Identifiers mapping email and student metadata */}
            {item.attendeeStudentId && (
              <Text
                style={[styles.traceText, { color: theme.textMuted }]}
                numberOfLines={1}
              >
                ID: {item.attendeeStudentId}
              </Text>
            )}
            {item.attendeeEmail && (
              <Text
                style={[
                  styles.traceText,
                  { color: theme.textMuted, marginBottom: 4 },
                ]}
                numberOfLines={1}
              >
                {item.attendeeEmail}
              </Text>
            )}

            <Text
              style={[styles.attendeeUniversity, { color: theme.textMuted }]}
              numberOfLines={1}
            >
              {item.attendeeUniversity || "Missing Info"}
            </Text>

            <View style={styles.metaRow}>
              {item.attendeeCategory && (
                <View
                  style={[
                    styles.categoryBadge,
                    { backgroundColor: `${theme.primary}15` },
                  ]}
                >
                  <Text
                    style={[styles.categoryBadgeText, { color: theme.primary }]}
                  >
                    {item.attendeeCategory}
                  </Text>
                </View>
              )}
            </View>
            <Text style={[styles.tokenText, { color: theme.textMuted }]}>
              Token: {item.scannedToken.substring(0, 8).toUpperCase()}...
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.scannerInfo}>
            <Text style={[styles.label, { color: theme.textMuted }]}>
              ACTION BY
            </Text>
            <Text
              style={[styles.attendeeName, { color: theme.textMain }]}
              numberOfLines={1}
            >
              {item.volunteerName || "System"}
            </Text>

            {item.volunteerRole && (
              <View
                style={[
                  styles.roleBadge,
                  {
                    backgroundColor:
                      item.volunteerRole === "ADMIN"
                        ? `${theme.primary}15`
                        : `${theme.success}15`,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.roleBadgeText,
                    {
                      color:
                        item.volunteerRole === "ADMIN"
                          ? theme.primary
                          : theme.success,
                    },
                  ]}
                >
                  {item.volunteerRole}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.background }]}
    >
      {/* SECTION: SCREEN HEADER */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.primary }]}>
          System Audit Trail
        </Text>
        {meta && (
          <Text style={[styles.totalLogs, { color: theme.textMuted }]}>
            {meta.totalLogs} Records
          </Text>
        )}
      </View>

      {/* SECTION: ADVANCED COMPREHENSIVE FILTER HOOK OVERLAYS */}
      <View style={styles.filterControlPanel}>
        <View style={styles.searchRow}>
          <View
            style={[
              styles.searchBarContainer,
              { backgroundColor: theme.surface },
            ]}
          >
            <Feather
              name="search"
              size={18}
              color={theme.textMuted}
              style={styles.searchIcon}
            />
            <TextInput
              style={[styles.searchInput, { color: theme.textMain }]}
              placeholder="Search Name, Email, Student ID..."
              placeholderTextColor={theme.textMuted}
              value={searchQuery}
              onChangeText={(text) => {
                setLogs([]);
                setSearchQuery(text);
              }}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Feather
                  name="x"
                  size={16}
                  color={theme.textMuted}
                  style={{ marginRight: 8 }}
                />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.advancedToggleBtn,
              { backgroundColor: theme.surface },
            ]}
            onPress={() => setShowAdvancedFilters(!showAdvancedFilters)}
          >
            <Ionicons
              name={showAdvancedFilters ? "funnel" : "funnel-outline"}
              size={20}
              color={showAdvancedFilters ? theme.primary : theme.textMuted}
            />
          </TouchableOpacity>
        </View>

        {/* Extended Control Dropdown Blocks displaying optional criteria elements */}
        {showAdvancedFilters && (
          <View
            style={[
              styles.advancedPanelBody,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <Text style={[styles.panelLabel, { color: theme.textMain }]}>
              Filter By Staff Member
            </Text>
            <View
              style={[styles.inlineInputWrapper, { borderColor: theme.border }]}
            >
              <Feather
                name="user"
                size={14}
                color={theme.textMuted}
                style={{ marginRight: 8 }}
              />
              <TextInput
                style={[styles.inlineInput, { color: theme.textMain }]}
                placeholder="Volunteer Name..."
                placeholderTextColor={theme.textMuted}
                value={volunteerQuery}
                onChangeText={(text) => {
                  setLogs([]);
                  setVolunteerQuery(text);
                }}
              />
            </View>

            <Text
              style={[
                styles.panelLabel,
                { color: theme.textMain, marginTop: 12 },
              ]}
            >
              Filter By Event Category
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryPillScroll}
            >
              {EVENT_CATEGORIES.map((cat) => {
                const isCatActive = selectedCategory === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryPill,
                      { backgroundColor: theme.background },
                      isCatActive && { backgroundColor: theme.primary },
                    ]}
                    onPress={() => {
                      setLogs([]);
                      setSelectedCategory(cat);
                    }}
                  >
                    <Text
                      style={[
                        styles.categoryPillText,
                        { color: isCatActive ? "#FFF" : theme.textMuted },
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}
      </View>

      {/* SECTION: CORE TAB BAR PILLS */}
      <View style={styles.tabsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScrollContent}
        >
          {(
            [
              { id: "ALL", icon: "layers", activeColor: theme.primary },
              {
                id: "SUCCESS",
                icon: "check-circle",
                activeColor: theme.success,
              },
              { id: "DUPLICATE", icon: "copy", activeColor: theme.error }, // Bold Amber/Orange
              {
                id: "INVALID",
                icon: "alert-triangle",
                activeColor: "#D97706",
              },
              { id: "MANUAL_OVERRIDE", icon: "edit-3", activeColor: "#8B5CF6" }, // Deep Purple
            ] as { id: FilterTab; icon: any; activeColor: string }[]
          ).map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.tab,
                  { backgroundColor: theme.surface },
                  isActive && {
                    backgroundColor: `${tab.activeColor}15`, // Beautiful 15% opacity tint
                  },
                ]}
                onPress={() => handleTabChange(tab.id)}
              >
                <Feather
                  name={tab.icon}
                  size={14}
                  color={isActive ? tab.activeColor : theme.textMuted}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    styles.tabText,
                    {
                      color: isActive ? tab.activeColor : theme.textMuted,
                      fontWeight: isActive ? "800" : "600",
                    },
                  ]}
                >
                  {tab.id.replace("_", " ")}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* SECTION: FLATLIST RENDERING SCHEDULER */}
      {isLoading && logs.length === 0 ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(item) => item.id}
          renderItem={renderLogItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather
                name="inbox"
                size={48}
                color={theme.textMuted}
                style={{ marginBottom: 16 }}
              />
              <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                No audit matches found for current filter selections.
              </Text>
            </View>
          }
          ListFooterComponent={
            logs.length > 0 && meta && meta.totalPages > 1 ? (
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
                  onPress={() => fetchLogs(meta.currentPage - 1)}
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
                  onPress={() => fetchLogs(meta.currentPage + 1)}
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
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  centerContent: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SIZES.padding,
    paddingTop: Platform.OS === "android" ? 40 : 16,
    paddingBottom: 12,
  },
  headerTitle: { ...FONTS.header, fontSize: 24 },
  totalLogs: { ...FONTS.body, fontWeight: "600" },

  // Advanced Filter Layout Modules
  filterControlPanel: { paddingHorizontal: SIZES.padding, marginBottom: 12 },
  searchRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    borderRadius: SIZES.radius,
    height: 48,
    paddingHorizontal: 12,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, ...FONTS.body, fontSize: 15, height: "100%" },
  advancedToggleBtn: {
    height: 48,
    width: 48,
    borderRadius: SIZES.radius,
    alignItems: "center",
    justifyContent: "center",
  },
  advancedPanelBody: {
    marginTop: 8,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    padding: 14,
  },
  panelLabel: {
    ...FONTS.body,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  inlineInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    height: 40,
    paddingHorizontal: 10,
  },
  inlineInput: { flex: 1, ...FONTS.body, fontSize: 14, height: "100%" },
  categoryPillScroll: { gap: 8, paddingTop: 4 },
  categoryPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  categoryPillText: { ...FONTS.body, fontSize: 12, fontWeight: "600" },

  tabsWrapper: { marginBottom: 12 },
  tabsScrollContent: { paddingHorizontal: SIZES.padding, paddingVertical: 4 },
  tab: {
    flexDirection: "row",
    paddingHorizontal: 18,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: SIZES.radius - 4,
    marginRight: 10,
  },
  tabText: { ...FONTS.body, fontSize: 13, letterSpacing: 0.5 },

  listContent: { paddingHorizontal: SIZES.padding, paddingBottom: 40 },
  logCard: {
    borderRadius: SIZES.radius,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  logHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
    paddingBottom: 10,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    ...FONTS.body,
    fontWeight: "700",
    fontSize: 11,
    marginLeft: 6,
    letterSpacing: 0.5,
  },
  timeText: { ...FONTS.body, fontSize: 12, fontWeight: "500" },

  logBody: { flexDirection: "row", paddingTop: 2 },
  participantInfo: { flex: 1.3, justifyContent: "flex-start" },
  traceText: { ...FONTS.body, fontSize: 13, fontWeight: "500", lineHeight: 17 },
  scannerInfo: { flex: 0.9, paddingLeft: 12, justifyContent: "flex-start" },
  divider: { width: 1, backgroundColor: "#E2E8F0", marginHorizontal: 6 },
  label: {
    ...FONTS.body,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 6,
  },
  attendeeName: {
    ...FONTS.body,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
  },
  attendeeUniversity: { ...FONTS.muted, fontSize: 12, marginBottom: 8 },
  metaRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  categoryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
  },
  categoryBadgeText: {
    ...FONTS.body,
    fontSize: 9,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginTop: 6,
  },
  roleBadgeText: {
    ...FONTS.body,
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  tokenText: {
    ...FONTS.body,
    fontSize: 11,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },

  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 80,
  },
  emptyText: { ...FONTS.body, fontSize: 15, textAlign: "center" },
  paginationWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 20,
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
});
