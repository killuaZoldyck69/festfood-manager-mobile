import LogCard from "@/components/logs/LogCard";
import React, { useState } from "react";
import { FlatList, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { EmptyState } from "../../components/ui/EmptyState";
import { PaginationFooter } from "../../components/ui/PaginationFooter";
import { FONTS, SIZES } from "../../constants/theme";
import { useApiFetch } from "../../hooks/use-api-fetch";
import { useTheme } from "../../hooks/use-theme";
import { FormattedLog } from "../../types";

export default function VolunteerLogsScreen(): React.ReactElement {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState<string>("ALL");

  const params: Record<string, string> = {
    ...(activeTab !== "ALL" && { status: activeTab }),
  };

  const { data, meta, isLoading, error, fetch } = useApiFetch<FormattedLog>(
    "/volunteer/logs",
    params,
  );

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.background }]}
    >
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.textMain }]}>
          My Recent Scans
        </Text>
        <Text style={[styles.totalLogs, { color: theme.textMuted }]}>
          {meta.total} Records
        </Text>
      </View>

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
          renderItem={({ item }) => <LogCard item={item} />}
          contentContainerStyle={styles.listContent}
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
  },
  headerTitle: { ...FONTS.header, fontSize: 24 },
  totalLogs: { ...FONTS.body, fontWeight: "600" },
  listContent: { paddingHorizontal: SIZES.padding, paddingBottom: 40 },
});
