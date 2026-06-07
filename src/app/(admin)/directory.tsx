import React, { useState } from "react";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";

import AttendeeCard from "@/components/directory/AttendeeCard";
import DirectoryFilters from "@/components/directory/DirectoryFilters";
import DirectoryModals, {
  ErrorModalInfo,
} from "@/components/directory/DirectoryModals";
import { EmptyState } from "../../components/ui/EmptyState";
import { PaginationFooter } from "../../components/ui/PaginationFooter";
import { FONTS, SIZES } from "../../constants/theme";
import { useApiFetch } from "../../hooks/use-api-fetch";
import { useTheme } from "../../hooks/use-theme";
import { AttendeeListItem } from "../../types";
import { apiClient } from "../../utils/apiClient";

export default function AdminDirectoryScreen(): React.ReactElement {
  const theme = useTheme();

  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedUniversity, setSelectedUniversity] = useState<string>("ALL");

  const params: Record<string, string> = {
    ...(activeTab !== "ALL" && { status: activeTab }),
    ...(selectedCategory !== "ALL" && { category: selectedCategory }),
    ...(selectedUniversity !== "ALL" && { university: selectedUniversity }),
    ...(searchQuery.trim() !== "" && { search: searchQuery.trim() }),
  };

  const { data, meta, isLoading, error, fetch } = useApiFetch<AttendeeListItem>(
    "/admin/attendees",
    params,
  );

  const [selectedAttendee, setSelectedAttendee] =
    useState<AttendeeListItem | null>(null);
  const [claimConfirmAttendee, setClaimConfirmAttendee] =
    useState<AttendeeListItem | null>(null);
  const [errorModalInfo, setErrorModalInfo] = useState<ErrorModalInfo | null>(
    null,
  );

  const handleManualClaim = async (): Promise<void> => {
    if (!claimConfirmAttendee) return;

    try {
      const response = await apiClient("/admin/override", {
        method: "POST",
        body: JSON.stringify({ attendeeId: claimConfirmAttendee.id }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errMsg = (errorData.message || "").toUpperCase();
        if (errMsg.includes("NO FOOD") || errMsg.includes("DEPLETED")) {
          throw new Error("OUT_OF_STOCK");
        }
        throw new Error("Failed to process claim.");
      }
      setClaimConfirmAttendee(null);
      fetch(meta.page);
    } catch (err) {
      setClaimConfirmAttendee(null);
      if (err instanceof Error && err.message === "OUT_OF_STOCK") {
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
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.surface }]}>
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
          filterOptions={{ categories: [], universities: [] }} // Hook/Context needed for filter source
          clearFilters={() => {
            setSearchQuery("");
            setSelectedCategory("ALL");
            setSelectedUniversity("ALL");
            setActiveTab("ALL");
          }}
        />

        {error ? (
          <EmptyState icon="alert-octagon" message={error} />
        ) : isLoading && data.length === 0 ? (
          <EmptyState icon="search" message="Loading attendees..." />
        ) : data.length === 0 ? (
          <EmptyState icon="users" message="No attendees found." />
        ) : (
          <View style={styles.list}>
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
              isLoading={isLoading}
              onPrev={() => fetch(meta.page - 1)}
              onNext={() => fetch(meta.page + 1)}
            />
          </View>
        )}
      </View>

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
  safeArea: { flex: 1 },
  container: { flex: 1 },
  header: { padding: SIZES.padding },
  headerTitle: { ...FONTS.header, fontSize: 28 },
  totalLogs: { ...FONTS.body, fontWeight: "600" },
  list: { flex: 1, paddingHorizontal: SIZES.padding },
});
