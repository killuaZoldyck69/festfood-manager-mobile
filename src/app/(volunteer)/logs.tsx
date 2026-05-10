// app/(volunteer)/logs.tsx
import { FONTS, SIZES } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { apiClient } from "@/utils/apiClient";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface ScanLog {
  id: string;
  status: string;
  scannedToken: string;
  scannedAt: string;
  attendeeName: string | null;
}

interface MetaData {
  totalLogs: number;
  currentPage: number;
  totalPages: number;
  hasMore: boolean;
}

// 🔴 ADDED: Filter Types
type FilterTab = "ALL" | "SUCCESS" | "DUPLICATE";

const formatTime = (isoString: string) => {
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const formatDate = (isoString: string) => {
  const date = new Date(isoString);
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
};

export default function VolunteerLogsScreen() {
  const theme = useTheme();

  const [logs, setLogs] = useState<ScanLog[]>([]);
  const [meta, setMeta] = useState<MetaData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 🔴 ADDED: State for active filter tab
  const [activeTab, setActiveTab] = useState<FilterTab>("ALL");

  useFocusEffect(
    useCallback(() => {
      fetchLogs(1, activeTab);
    }, [activeTab]), // Re-runs automatically if tab changes while focused
  );

  // 🔴 UPDATED: fetchLogs now accepts and appends the status filter
  const fetchLogs = async (
    pageNumber: number,
    currentTab: FilterTab = activeTab,
  ) => {
    setIsLoading(true);

    try {
      // Build the dynamic URL based on the selected tab
      let url = `/volunteer/logs?page=${pageNumber}&limit=10`;

      if (currentTab !== "ALL") {
        url += `&status=${currentTab}`;
      }

      const response = await apiClient(url, { method: "GET" });

      if (response.ok) {
        const data = await response.json();

        let finalLogs = data.logs;
        let finalMeta = data.meta;

        // Smart fallback in case backend ignores the limit
        if (data.logs.length > 10 && data.meta.totalPages === 1) {
          const startIndex = (pageNumber - 1) * 10;
          const endIndex = startIndex + 10;

          finalLogs = data.logs.slice(startIndex, endIndex);
          finalMeta = {
            totalLogs: data.logs.length,
            currentPage: pageNumber,
            totalPages: Math.ceil(data.logs.length / 10),
            hasMore: endIndex < data.logs.length,
          };
        }

        setLogs(finalLogs);
        setMeta(finalMeta);
      }
    } catch (error) {
      console.error("Failed to fetch logs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 🔴 ADDED: Handler to instantly clear UI and fetch new category
  const handleTabChange = (tab: FilterTab) => {
    setActiveTab(tab);
    setLogs([]); // Instantly clears the old list for better UX
    setMeta(null);
    fetchLogs(1, tab); // Fetches Page 1 of the new category
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
          <Text style={[styles.label, { color: theme.textMuted }]}>
            ATTENDEE
          </Text>
          <Text style={[styles.value, { color: theme.textMain }]}>
            {item.attendeeName || "Unknown / Invalid Token"}
          </Text>
          <Text style={[styles.tokenText, { color: theme.textMuted }]}>
            Token: {item.scannedToken.substring(0, 8)}...
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.background }]}
    >
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.primary }]}>
          My Recent Scans
        </Text>
        {meta && (
          <Text style={[styles.totalLogs, { color: theme.textMuted }]}>
            {meta.totalLogs} Records
          </Text>
        )}
      </View>

      {/* 🔴 ADDED: Interactive Filter Tabs */}
      <View style={[styles.tabsContainer, { backgroundColor: theme.surface }]}>
        {(["ALL", "SUCCESS", "DUPLICATE"] as FilterTab[]).map((tab) => {
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

      {isLoading && logs.length === 0 ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(item, index) => `${item.id}-${index}`}
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
                No scans found for this filter.
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

// -----------------------------------------------------
// STYLES
// -----------------------------------------------------
const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  centerContent: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SIZES.padding,
    paddingVertical: 16,
    paddingTop: Platform.OS === "android" ? 40 : 16,
  },
  headerTitle: { ...FONTS.header, fontSize: 24 },
  totalLogs: { ...FONTS.body, fontWeight: "600" },

  // 🔴 ADDED: Tab Styles
  tabsContainer: {
    flexDirection: "row",
    marginHorizontal: SIZES.padding,
    marginBottom: 16,
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

  listContent: { paddingHorizontal: SIZES.padding, paddingBottom: 40 },

  logCard: {
    borderRadius: SIZES.radius,
    padding: 16,
    marginBottom: 16,
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
    marginBottom: 16,
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

  logBody: { flexDirection: "column", alignItems: "flex-start" },

  label: {
    ...FONTS.body,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 4,
  },
  value: { ...FONTS.body, fontSize: 15, fontWeight: "600", marginBottom: 2 },
  tokenText: {
    ...FONTS.body,
    fontSize: 12,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },

  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 100,
  },
  emptyText: { ...FONTS.body, fontSize: 16 },

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
});
