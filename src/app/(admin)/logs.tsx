// app/(admin)/logs.tsx
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
  volunteerName: string;
  attendeeName: string | null;
}

interface MetaData {
  totalLogs: number;
  currentPage: number;
  totalPages: number;
  hasMore: boolean;
}

const formatTime = (isoString: string) => {
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const formatDate = (isoString: string) => {
  const date = new Date(isoString);
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
};

export default function AdminLogsScreen() {
  const theme = useTheme();

  const [logs, setLogs] = useState<ScanLog[]>([]);
  const [meta, setMeta] = useState<MetaData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initial Fetch (Page 1) when the tab is focused
  useFocusEffect(
    useCallback(() => {
      fetchLogs(1);
    }, []),
  );

  const fetchLogs = async (pageNumber: number) => {
    setIsLoading(true);

    try {
      // 1. Request strictly 10 items from the backend
      const response = await apiClient(
        `/admin/logs?page=${pageNumber}&limit=10`,
        { method: "GET" },
      );

      if (response.ok) {
        const data = await response.json();

        let finalLogs = data.logs;
        let finalMeta = data.meta;

        // 🔴 SMART FALLBACK: If backend ignores limit=10 and sends all 15 logs,
        // the frontend will manually slice the array so the UI works perfectly!
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

        // 2. Explicitly REPLACE the logs (don't append) to strictly show 10 at a time
        setLogs(finalLogs);
        setMeta(finalMeta);
      }
    } catch (error) {
      console.error("Failed to fetch logs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Ensure duplicate scans show Red Cross
  const getStatusVisuals = (status: string) => {
    const normalizedStatus = status.toUpperCase();

    if (
      normalizedStatus.includes("DUPLICATE") ||
      normalizedStatus.includes("ALREADY_CLAIMED")
    ) {
      return { color: theme.error, icon: "x-circle", bg: `${theme.error}15` }; // Red Cross
    }
    if (normalizedStatus.includes("SUCCESS")) {
      return {
        color: theme.success,
        icon: "check-circle",
        bg: `${theme.success}15`,
      }; // Green Check
    }
    if (normalizedStatus.includes("MANUAL_OVERRIDE")) {
      return { color: theme.primary, icon: "edit-3", bg: `${theme.primary}15` }; // Purple Pen
    }

    return {
      color: "#F59E0B",
      icon: "alert-triangle",
      bg: "rgba(245,158,11,0.15)",
    }; // Orange Alert
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
            <Text style={[styles.value, { color: theme.textMain }]}>
              {item.attendeeName || "Unknown / Invalid Token"}
            </Text>
            <Text style={[styles.tokenText, { color: theme.textMuted }]}>
              Token: {item.scannedToken.substring(0, 8)}...
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.scannerInfo}>
            <Text style={[styles.label, { color: theme.textMuted }]}>
              ACTION BY
            </Text>
            <Text style={[styles.value, { color: theme.textMain }]}>
              {item.volunteerName || "System"}
            </Text>
          </View>
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
          System Audit Trail
        </Text>
        {meta && (
          <Text style={[styles.totalLogs, { color: theme.textMuted }]}>
            {meta.totalLogs} Records
          </Text>
        )}
      </View>

      {isLoading ? (
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
                No scan logs recorded yet.
              </Text>
            </View>
          }
          /* 🔴 EXPLICIT PAGINATION FOOTER */
          ListFooterComponent={
            logs.length > 0 && meta ? (
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

  logBody: { flexDirection: "row", alignItems: "center" },
  participantInfo: { flex: 1 },
  scannerInfo: { flex: 0.8, paddingLeft: 16 },

  divider: {
    width: 1,
    height: "100%",
    backgroundColor: "#E2E8F0",
    marginHorizontal: 8,
  },

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

  // Pagination Styles
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
