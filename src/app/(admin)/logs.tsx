import React, { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import LogCard from "@/components/logs/LogCard";
import LogFilters, {
  FilterTab,
  LogFilterAggregation,
} from "@/components/logs/LogFilters";
import { EmptyState } from "../../components/ui/EmptyState";
import { PaginationFooter } from "../../components/ui/PaginationFooter";
import { FONTS, SIZES } from "../../constants/theme";
import { useApiFetch } from "../../hooks/use-api-fetch";
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
  const [filterOptions, setFilterOptions] = useState<LogFilterAggregation>({
    categories: [],
    volunteers: [],
  });

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const response = await apiClient("/admin/logs/filters");
        if (response.ok) {
          const json = await response.json();
          setFilterOptions(json.data || json);
        }
      } catch (err) {}
    };

    fetchFilters();
  }, []);

  const params: Record<string, string> = {
    ...(activeTab !== "ALL" && { status: activeTab }),
    ...(selectedCategory !== "ALL" && { category: selectedCategory }),
    ...(selectedVolunteerEmail !== "ALL" && {
      volunteerEmail: selectedVolunteerEmail,
    }),
    ...(searchQuery.trim() !== "" && { search: searchQuery.trim() }),
  };

  const { data, meta, isLoading, error, fetch } = useApiFetch<FormattedLog>(
    "/admin/logs",
    params,
  );

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
          {meta?.total || 0} Records
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
        <EmptyState icon="alert-octagon" message={error} />
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
              onPrev={() => fetch(meta.page - 1)}
              onNext={() => fetch(meta.page + 1)}
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
  headerTitle: { ...FONTS.header, fontSize: 24 },
  totalLogs: { ...FONTS.body, fontWeight: "600" },
  listContent: { paddingHorizontal: SIZES.padding, paddingBottom: 40 },
});
