import { FONTS, SIZES } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { apiClient } from "@/utils/apiClient";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
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

import LogCard, { ScanLog } from "@/components/admin/logs/LogCard";
import LogFilters, { FilterTab } from "@/components/admin/logs/LogFilters";

interface MetaData {
  totalLogs: number;
  currentPage: number;
  totalPages: number;
  hasMore: boolean;
  currentFilter?: string;
}

export default function AdminLogsScreen() {
  const theme = useTheme();

  // --- DATA STATE ---
  const [logs, setLogs] = useState<ScanLog[]>([]);
  const [meta, setMeta] = useState<MetaData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // --- FILTER STATE ---
  const [filterOptions, setFilterOptions] = useState<{
    categories: { name: string; count?: number }[];
    volunteers: { name: string; email?: string; count?: number }[];
  }>({
    categories: [{ name: "ALL" }],
    volunteers: [{ name: "ALL" }],
  });

  const [activeTab, setActiveTab] = useState<FilterTab>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedVolunteerEmail, setSelectedVolunteerEmail] = useState("ALL");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // 1. Initial Load: Fetch dynamic options
  useFocusEffect(
    useCallback(() => {
      const fetchDynamicFilters = async () => {
        try {
          const response = await apiClient(
            `/admin/logs/filters?_t=${Date.now()}`,
            {
              method: "GET",
              headers: {
                "Cache-Control": "no-cache, no-store, must-revalidate",
                Pragma: "no-cache",
                Expires: "0",
              },
            },
          );
          if (response.ok) {
            const data = await response.json();
            const payload = data.data ? data.data : data;
            setFilterOptions({
              categories: [{ name: "ALL" }, ...(payload.categories || [])],
              volunteers: [{ name: "ALL" }, ...(payload.volunteers || [])],
            });
          }
        } catch (error) {
          console.error("Failed to fetch log filters:", error);
        }
      };
      fetchDynamicFilters();
    }, []),
  );

  // 2. Debounce Search
  // 🔴 FIX: Removed the unconditional setLogs([]) that was wiping the screen
  // after 500ms of the component mounting.
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // 3. API Query execution
  const fetchLogs = async (pageNumber: number) => {
    setIsLoading(true);
    try {
      // 🔴 FIX: Added deep cache-busting timestamp to the main query URL to force fresh data
      let url = `/admin/logs?page=${pageNumber}&limit=10&_t=${Date.now()}`;
      if (activeTab !== "ALL") url += `&status=${activeTab}`;
      if (selectedCategory !== "ALL")
        url += `&category=${encodeURIComponent(selectedCategory)}`;
      if (selectedVolunteerEmail !== "ALL")
        url += `&volunteerEmail=${encodeURIComponent(selectedVolunteerEmail)}`;
      if (debouncedSearch.trim().length > 0)
        url += `&search=${encodeURIComponent(debouncedSearch.trim())}`;

      // 🔴 FIX: Added strict no-cache headers to the main list query
      const response = await apiClient(url, {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      });

      if (response.ok) {
        const data = await response.json();
        const payload = data.data ? data.data : data;

        let finalLogs = payload.logs || [];
        let finalMeta = payload.meta || null;

        if (
          finalLogs.length > 10 &&
          (!finalMeta || finalMeta.totalPages === 1)
        ) {
          const startIndex = (pageNumber - 1) * 10;
          finalLogs = payload.logs.slice(startIndex, startIndex + 10);
          finalMeta = {
            totalLogs: payload.logs.length,
            currentPage: pageNumber,
            totalPages: Math.ceil(payload.logs.length / 10),
            hasMore: startIndex + 10 < payload.logs.length,
            currentFilter: activeTab,
          };
        }
        setLogs(finalLogs);
        setMeta(finalMeta);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchLogs(1);
    }, [activeTab, debouncedSearch, selectedVolunteerEmail, selectedCategory]),
  );

  const clearFilters = useCallback(() => {
    setLogs([]);
    setSearchQuery("");
    setSelectedCategory("ALL");
    setSelectedVolunteerEmail("ALL");
    setActiveTab("ALL");
  }, []);

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

      {/* COMPONENT: Filter Controls */}
      <LogFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        activeTab={activeTab}
        setActiveTab={(val) => {
          if (val !== activeTab) {
            setLogs([]);
            setActiveTab(val);
          }
        }}
        selectedCategory={selectedCategory}
        setSelectedCategory={(val) => {
          if (val !== selectedCategory) {
            setLogs([]);
            setSelectedCategory(val);
          }
        }}
        selectedVolunteerEmail={selectedVolunteerEmail}
        setSelectedVolunteerEmail={(val) => {
          if (val !== selectedVolunteerEmail) {
            setLogs([]);
            setSelectedVolunteerEmail(val);
          }
        }}
        filterOptions={filterOptions}
        clearFilters={clearFilters}
      />

      <FlatList
        data={logs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <LogCard item={item} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.centerContent}>
            {isLoading ? (
              <ActivityIndicator size="large" color={theme.primary} />
            ) : (
              <View style={styles.emptyContainer}>
                <Feather
                  name="inbox"
                  size={48}
                  color={theme.textMuted}
                  style={{ marginBottom: 16 }}
                />
                <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                  No audit matches found for current filters.
                </Text>
              </View>
            )}
          </View>
        }
        ListFooterComponent={
          logs.length > 0 && meta && meta.totalPages > 1 ? (
            <View style={styles.paginationWrapper}>
              <TouchableOpacity
                style={[
                  styles.pageBtn,
                  meta.currentPage === 1 && { opacity: 0.5 },
                  { backgroundColor: theme.surface, borderColor: theme.border },
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
                  !meta.hasMore && { opacity: 0.5 },
                  { backgroundColor: theme.surface, borderColor: theme.border },
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
  listContent: { paddingHorizontal: SIZES.padding, paddingBottom: 40 },
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
  pageBtnText: { ...FONTS.body, fontWeight: "700", fontSize: 14 },
  pageIndicator: { ...FONTS.body, fontWeight: "600", fontSize: 14 },
});
