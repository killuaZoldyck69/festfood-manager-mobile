import LogFilters, { FilterTab } from "@/components/logs/LogFilters";
import VolunteerLogCard from "@/components/logs/VolunteerLogCard";
import React, { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { EmptyState } from "../../components/ui/EmptyState";
import { PaginationFooter } from "../../components/ui/PaginationFooter";
import { FONTS, SIZES } from "../../constants/theme";
import { useApiFetch } from "../../hooks/use-api-fetch";
import { useTheme } from "../../hooks/use-theme";
import { FormattedLog } from "../../types";

export default function VolunteerLogsScreen(): React.ReactElement {
  const theme = useTheme();

  const [activeTab, setActiveTab] = useState<FilterTab>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const params: Record<string, string> = {
    ...(activeTab !== "ALL" && { status: activeTab }),
    ...(searchQuery.trim() !== "" && { search: searchQuery.trim() }),
  };

  const { data, meta, isLoading, error, fetch } = useApiFetch<FormattedLog>(
    "/volunteer/logs",
    params,
  );

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetch(1);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [activeTab, searchQuery]);

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.safeArea, { backgroundColor: theme.background }]}
    >
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.textMain }]}>
          My Recent Scans
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
        selectedCategory="ALL"
        setSelectedCategory={() => {}}
        selectedVolunteerEmail="ALL"
        setSelectedVolunteerEmail={() => {}}
        filterOptions={{ categories: [], volunteers: [] }}
        clearFilters={() => {
          setSearchQuery("");
          setActiveTab("ALL");
        }}
        hideAdvancedFilters={true}
        hideManualOverrideTab={true}
      />

      {error ? (
        <EmptyState icon="alert-octagon" message={error} />
      ) : isLoading && data.length === 0 ? (
        <EmptyState icon="search" message="Loading logs..." />
      ) : data.length === 0 ? (
        <EmptyState icon="inbox" message="No scans found." />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <VolunteerLogCard item={item} />}
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
