import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AttendeeCard from "@/components/directory/AttendeeCard";
import DirectoryFilters, {
  DirectoryFilterAggregation,
} from "@/components/directory/DirectoryFilters";
import DirectoryModals, {
  ErrorModalInfo,
} from "@/components/directory/DirectoryModals";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Toast from "react-native-toast-message";
import { EmptyState } from "../../components/ui/EmptyState";
import { PaginationFooter } from "../../components/ui/PaginationFooter";
import { QUERY_KEYS } from "../../constants/queryKeys";
import { FONTS, SIZES } from "../../constants/theme";
import { useTheme } from "../../hooks/use-theme";
import { AttendeeListItem } from "../../types";
import { apiClient } from "../../utils/apiClient";

export default function AdminDirectoryScreen(): React.ReactElement {
  const theme = useTheme();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedUniversity, setSelectedUniversity] = useState<string>("ALL");

  const [page, setPage] = useState<number>(1);

  useEffect(() => {
    setPage(1);
  }, [activeTab, searchQuery, selectedCategory, selectedUniversity]);

  const { data: filterOptions = { categories: [], universities: [] } } =
    useQuery<DirectoryFilterAggregation>({
      queryKey: QUERY_KEYS.attendeeFilters,
      queryFn: async () => {
        const response = await apiClient("/admin/attendees/filters");
        if (!response.ok) return { categories: [], universities: [] };
        const json = await response.json();
        return json.data || json;
      },
      staleTime: Infinity,
    });

  const activeParams: Record<string, string> = {
    ...(activeTab !== "ALL" && { status: activeTab }),
    ...(selectedCategory !== "ALL" && { category: selectedCategory }),
    ...(selectedUniversity !== "ALL" && { university: selectedUniversity }),
    ...(searchQuery.trim() !== "" && { search: searchQuery.trim() }),
  };

  const {
    data: attendeesData,
    isLoading,
    error,
  } = useQuery({
    queryKey: QUERY_KEYS.attendees({ ...activeParams, page: String(page) }),
    queryFn: async () => {
      const queryParams = new URLSearchParams({ page: String(page) });
      Object.entries(activeParams).forEach(([key, val]) =>
        queryParams.append(key, val),
      );

      const res = await apiClient(`/admin/attendees?${queryParams.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch attendees");
      return await res.json();
    },
  });

  const data: AttendeeListItem[] = attendeesData?.data || [];
  const meta = attendeesData?.meta || {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
    hasMore: false,
  };

  const [selectedAttendee, setSelectedAttendee] =
    useState<AttendeeListItem | null>(null);
  const [claimConfirmAttendee, setClaimConfirmAttendee] =
    useState<AttendeeListItem | null>(null);
  const [errorModalInfo, setErrorModalInfo] = useState<ErrorModalInfo | null>(
    null,
  );

  const overrideMutation = useMutation({
    mutationFn: async (attendeeId: string) => {
      const response = await apiClient("/admin/override", {
        method: "POST",
        body: JSON.stringify({ attendeeId }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errMsg = (errorData.message || "").toUpperCase();
        if (errMsg.includes("NO FOOD") || errMsg.includes("DEPLETED")) {
          throw new Error("OUT_OF_STOCK");
        }
        throw new Error("Failed to process claim.");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendees"] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.inventory });
      queryClient.invalidateQueries({ queryKey: ["logs"] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.logFilters });

      setClaimConfirmAttendee(null);

      Toast.show({
        type: "success",
        text1: "Claim Successful",
        text2: "Attendee ticket manually marked as claimed.",
        position: "bottom",
      });
    },
    onError: (err) => {
      setClaimConfirmAttendee(null);
      if (err.message === "OUT_OF_STOCK") {
        setErrorModalInfo({
          title: "Out of Stock",
          message:
            "Inventory is completely depleted. Increase limits on the dashboard.",
          type: "OUT_OF_STOCK",
        });
      } else {
        setErrorModalInfo({
          title: "Override Failed",
          message: "Could not mark as claimed. Check your connection.",
          type: "ERROR",
        });
      }
    },
  });

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.safeArea, { backgroundColor: theme.surface }]}
    >
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.primary }]}>
          Attendee Directory
        </Text>
        <Text style={[styles.totalLogs, { color: theme.textMuted }]}>
          {meta.total} Registered
        </Text>
      </View>

      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <DirectoryFilters
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          selectedUniversity={selectedUniversity}
          setSelectedUniversity={setSelectedUniversity}
          filterOptions={filterOptions}
          clearFilters={() => {
            setSearchQuery("");
            setSelectedCategory("ALL");
            setSelectedUniversity("ALL");
            setActiveTab("ALL");
          }}
        />

        {error ? (
          <EmptyState icon="alert-octagon" message={error.message} />
        ) : isLoading && data.length === 0 ? (
          <EmptyState icon="search" message="Loading attendees..." />
        ) : data.length === 0 ? (
          <EmptyState icon="users" message="No attendees found." />
        ) : (
          <ScrollView
            style={styles.list}
            contentContainerStyle={{ paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          >
            {data.map((item) => (
              <AttendeeCard
                key={item.id}
                item={item}
                onSelect={setSelectedAttendee}
                onManualClaim={setClaimConfirmAttendee}
              />
            ))}
            <PaginationFooter
              meta={meta}
              isLoading={isLoading || overrideMutation.isPending}
              onPrev={() => setPage((p) => Math.max(1, p - 1))}
              onNext={() => setPage((p) => p + 1)}
            />
          </ScrollView>
        )}
      </View>

      <DirectoryModals
        selectedAttendee={selectedAttendee}
        setSelectedAttendee={setSelectedAttendee}
        claimConfirmAttendee={claimConfirmAttendee}
        setClaimConfirmAttendee={setClaimConfirmAttendee}
        errorModalInfo={errorModalInfo}
        setErrorModalInfo={setErrorModalInfo}
        handleManualClaim={() =>
          claimConfirmAttendee &&
          overrideMutation.mutate(claimConfirmAttendee.id)
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  header: {
    padding: SIZES.padding,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: { ...FONTS.header, fontSize: 26 },
  totalLogs: { ...FONTS.body, fontWeight: "600" },
  list: { flex: 1, paddingHorizontal: SIZES.padding },
});
