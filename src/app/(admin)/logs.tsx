import React, { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import LogCard from "@/components/logs/LogCard";
import LogFilters, {
  FilterTab,
  LogFilterAggregation,
} from "@/components/logs/LogFilters";
import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "../../components/ui/EmptyState";
import { PaginationFooter } from "../../components/ui/PaginationFooter";
import { QUERY_KEYS } from "../../constants/queryKeys";
import { FONTS, SIZES } from "../../constants/theme";
import { useTheme } from "../../hooks/use-theme";
import { FormattedLog } from "../../types";
import { apiClient } from "../../utils/apiClient";

export default function AdminLogsScreen(): React.ReactElement {
  const theme = useTheme();

  const [activeTab, setActiveTab] = useState<FilterTab>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedVolunteerEmail, setSelectedVolunteerEmail] =
    useState<string>("ALL");

  const [page, setPage] = useState<number>(1);

  useEffect(() => {
    setPage(1);
  }, [activeTab, searchQuery, selectedCategory, selectedVolunteerEmail]);

  const { data: filterOptions = { categories: [], volunteers: [] } } =
    useQuery<LogFilterAggregation>({
      queryKey: QUERY_KEYS.logFilters,
      queryFn: async () => {
        const response = await apiClient("/admin/logs/filters");
        if (!response.ok) return { categories: [], volunteers: [] };
        const json = await response.json();
        return json.data || json;
      },
    });

  const activeParams: Record<string, string> = {
    ...(activeTab !== "ALL" && { status: activeTab }),
    ...(selectedCategory !== "ALL" && { category: selectedCategory }),
    ...(selectedVolunteerEmail !== "ALL" && {
      volunteerEmail: selectedVolunteerEmail,
    }),
    ...(searchQuery.trim() !== "" && { search: searchQuery.trim() }),
  };

  const {
    data: logsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: QUERY_KEYS.logs({ ...activeParams, page: String(page) }),
    queryFn: async () => {
      const queryParams = new URLSearchParams({ page: String(page) });
      Object.entries(activeParams).forEach(([key, val]) =>
        queryParams.append(key, val),
      );

      const res = await apiClient(`/admin/logs?${queryParams.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch logs");
      return await res.json();
    },
  });

  const data: FormattedLog[] = logsData?.data || [];
  const meta = logsData?.meta || {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
    hasMore: false,
  };

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.safeArea, { backgroundColor: theme.background }]}
    >
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.primary }]}>
          System Audit Trail
        </Text>
        <Text style={[styles.totalLogs, { color: theme.textMuted }]}>
          {meta.total} Records
        </Text>
      </View>

      <LogFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedVolunteerEmail={selectedVolunteerEmail}
        setSelectedVolunteerEmail={setSelectedVolunteerEmail}
        filterOptions={filterOptions}
        clearFilters={() => {
          setSearchQuery("");
          setSelectedCategory("ALL");
          setSelectedVolunteerEmail("ALL");
          setActiveTab("ALL");
        }}
      />

      {error ? (
        <EmptyState icon="alert-octagon" message={error.message} />
      ) : isLoading && data.length === 0 ? (
        <EmptyState icon="search" message="Loading logs..." />
      ) : data.length === 0 ? (
        <EmptyState icon="inbox" message="No audit matches found." />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <LogCard item={item} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            <PaginationFooter
              meta={meta}
              isLoading={isLoading}
              onPrev={() => setPage((p) => Math.max(1, p - 1))}
              onNext={() => setPage((p) => p + 1)}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    padding: SIZES.padding,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: { ...FONTS.header, fontSize: 26 },
  totalLogs: { ...FONTS.body, fontWeight: "600" },
  listContent: { paddingHorizontal: SIZES.padding, paddingBottom: 40 },
});
