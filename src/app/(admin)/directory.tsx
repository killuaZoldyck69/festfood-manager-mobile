import AttendeeCard from "@/components/admin/directory/AttendeeCard";
import DirectoryFilters from "@/components/admin/directory/DirectoryFilters";
import DirectoryModals from "@/components/admin/directory/DirectoryModals";
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

export default function AdminDirectoryScreen() {
  const theme = useTheme();

  // --- DATA STATE ---
  const [attendees, setAttendees] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // --- FILTER STATE ---
  const [filterOptions, setFilterOptions] = useState({
    categories: [{ name: "ALL" }],
    universities: [{ name: "ALL" }],
  });
  const [activeTab, setActiveTab] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedUniversity, setSelectedUniversity] = useState("ALL");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // --- MODAL STATE ---
  const [selectedAttendee, setSelectedAttendee] = useState<any>(null);
  const [claimConfirmAttendee, setClaimConfirmAttendee] = useState<any>(null);
  const [errorModalInfo, setErrorModalInfo] = useState<any>(null);

  // 🔴 FIX 1: Changed from useEffect to useFocusEffect so dynamic filters
  // refresh automatically when navigating back from the Admin Center/Import screen!
  useFocusEffect(
    useCallback(() => {
      const fetchDynamicFilters = async () => {
        try {
          const response = await apiClient("/admin/attendees/filters", {
            method: "GET",
          });
          if (response.ok) {
            const data = await response.json();
            const payload = data.data ? data.data : data;

            setFilterOptions({
              categories: [{ name: "ALL" }, ...(payload.categories || [])],
              universities: [{ name: "ALL" }, ...(payload.universities || [])],
            });
          }
        } catch (error) {
          console.error("Failed to fetch filters", error);
        }
      };
      fetchDynamicFilters();
    }, []),
  );

  // 2. Debounce Search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setAttendees([]);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // 3. API Query execution
  const fetchAttendees = async (pageNumber: number) => {
    setIsLoading(true);
    try {
      let url = `/admin/attendees?page=${pageNumber}&limit=25`;
      if (activeTab !== "ALL") url += `&status=${activeTab}`;
      if (selectedCategory !== "ALL")
        url += `&category=${encodeURIComponent(selectedCategory)}`;
      if (selectedUniversity !== "ALL")
        url += `&university=${encodeURIComponent(selectedUniversity)}`;
      if (debouncedSearch.trim().length > 0)
        url += `&search=${encodeURIComponent(debouncedSearch.trim())}`;

      const response = await apiClient(url, { method: "GET" });
      if (response.ok) {
        const data = await response.json();
        const payload = data.data ? data.data : data;

        setAttendees(payload.attendees || []);
        setMeta(payload.meta || null);
      }
    } finally {
      setIsLoading(false);
    }
  };
  useFocusEffect(
    useCallback(() => {
      fetchAttendees(1);
    }, [activeTab, debouncedSearch, selectedCategory, selectedUniversity]),
  );

  const clearFilters = useCallback(() => {
    setAttendees([]);
    setSearchQuery("");
    setSelectedCategory("ALL");
    setSelectedUniversity("ALL");
    setActiveTab("ALL");
  }, []);

  // --- MANUAL CLAIM API ---
  const handleManualClaim = async () => {
    if (!claimConfirmAttendee) return;
    const attendeeId = claimConfirmAttendee.id;
    const previousAttendees = [...attendees];
    setClaimConfirmAttendee(null);

    setAttendees((prev) =>
      prev.map((a) =>
        a.id === attendeeId
          ? {
              ...a,
              foodClaimed: true,
              claimedAt: new Date().toISOString(),
              scannerName: "Manual Override",
              scannerRole: "ADMIN",
            }
          : a,
      ),
    );

    try {
      const response = await apiClient("/admin/override", {
        method: "POST",
        body: JSON.stringify({ attendeeId }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errMsg = (errorData.message || "").toUpperCase();
        if (errMsg.includes("NO FOOD") || errMsg.includes("DEPLETED"))
          throw new Error("OUT_OF_STOCK");
        throw new Error("Failed");
      }
    } catch (error: any) {
      setAttendees(previousAttendees);
      if (error.message === "OUT_OF_STOCK")
        setErrorModalInfo({
          title: "Out of Stock",
          message:
            "Inventory is completely depleted. Increase limits on the dashboard.",
          type: "OUT_OF_STOCK",
        });
      else
        setErrorModalInfo({
          title: "Override Failed",
          message: "Could not mark as claimed. Check your connection.",
          type: "ERROR",
        });
    }
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
        {/* COMPONENT: Filter Controls */}
        <DirectoryFilters
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          activeTab={activeTab}
          setActiveTab={(val) => {
            // 🔴 FIX 2: Guard clauses added to all setter functions
            if (val !== activeTab) {
              setAttendees([]);
              setActiveTab(val);
            }
          }}
          selectedCategory={selectedCategory}
          setSelectedCategory={(val) => {
            // 🔴 FIX 2: Guard clauses added to all setter functions
            if (val !== selectedCategory) {
              setAttendees([]);
              setSelectedCategory(val);
            }
          }}
          selectedUniversity={selectedUniversity}
          setSelectedUniversity={(val) => {
            // 🔴 FIX 2: Guard clauses added to all setter functions
            if (val !== selectedUniversity) {
              setAttendees([]);
              setSelectedUniversity(val);
            }
          }}
          filterOptions={filterOptions}
          clearFilters={clearFilters}
        />

        <FlatList
          data={attendees}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <AttendeeCard
              item={item}
              onSelect={setSelectedAttendee}
              onManualClaim={setClaimConfirmAttendee}
            />
          )}
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
                <View style={{ alignItems: "center", marginTop: 60 }}>
                  <Feather
                    name="search"
                    size={40}
                    color={theme.textMuted}
                    style={{ marginBottom: 16 }}
                  />
                  <Text style={{ color: theme.textMuted, ...FONTS.body }}>
                    No attendees found matching filters.
                  </Text>
                </View>
              )}
            </View>
          }
          ListFooterComponent={
            attendees.length > 0 && meta && meta.totalPages > 1 ? (
              <View style={styles.paginationWrapper}>
                <TouchableOpacity
                  style={[
                    styles.pageBtn,
                    meta.currentPage === 1 && { opacity: 0.5 },
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                    },
                  ]}
                  disabled={meta.currentPage === 1 || isLoading}
                  onPress={() => fetchAttendees(meta.currentPage - 1)}
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
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                    },
                  ]}
                  disabled={!meta.hasMore || isLoading}
                  onPress={() => fetchAttendees(meta.currentPage + 1)}
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

      {/* COMPONENT: All Modals */}
      <DirectoryModals
        selectedAttendee={selectedAttendee}
        setSelectedAttendee={setSelectedAttendee}
        claimConfirmAttendee={claimConfirmAttendee}
        setClaimConfirmAttendee={setClaimConfirmAttendee}
        errorModalInfo={errorModalInfo}
        setErrorModalInfo={setErrorModalInfo}
        handleManualClaim={handleManualClaim}
      />
    </SafeAreaView>
  );
}

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
  listContent: {
    paddingHorizontal: SIZES.padding,
    paddingTop: 8,
    paddingBottom: 100,
  },
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
  pageBtnText: { ...FONTS.body, fontWeight: "700", fontSize: 14 },
  pageIndicator: { ...FONTS.body, fontWeight: "600", fontSize: 14 },
});
