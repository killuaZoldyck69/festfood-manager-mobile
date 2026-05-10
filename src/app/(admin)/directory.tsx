// app/(admin)/directory.tsx
import { FONTS, SIZES } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { Feather } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// 👇 Import the central API Client
import { apiClient } from "@/utils/apiClient";

// Type definition based on your database schema
interface Attendee {
  id: string;
  name: string;
  university: string;
  category: string;
  status: "CLAIMED" | "PENDING";
  claimedAt?: string; // ISO String or formatted time
  scannedBy?: string;
}

type FilterTab = "ALL" | "CLAIMED" | "PENDING";

export default function AdminDirectoryScreen() {
  const theme = useTheme();

  // Screen State
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("ALL");

  // Modal State
  const [selectedAttendee, setSelectedAttendee] = useState<Attendee | null>(
    null,
  );

  // 1. Fetch Data with Debounce Strategy
  useEffect(() => {
    const fetchAttendees = async () => {
      setIsLoading(true);
      try {
        // 👇 Clean, unified API call that automatically handles Mobile Auth + CSRF
        const response = await apiClient(
          `/admin/attendees?search=${encodeURIComponent(searchQuery)}`,
          { method: "GET" },
        );

        if (response.ok) {
          const data = await response.json();

          // Strictly check the shape of the data
          if (Array.isArray(data)) {
            setAttendees(data); // Backend returned [...]
          } else if (data && Array.isArray(data.data)) {
            setAttendees(data.data); // Backend returned { data: [...] }
          } else if (data && Array.isArray(data.attendees)) {
            setAttendees(data.attendees); // Backend returned { attendees: [...] }
          } else {
            console.warn("Unexpected API response shape:", data);
            setAttendees(MOCK_ATTENDEES);
          }
        } else {
          console.warn(
            "Backend rejected GET request. Status:",
            response.status,
          );
          setAttendees(MOCK_ATTENDEES);
        }
      } catch (error) {
        console.error("Failed to fetch directory:", error);
        setAttendees(MOCK_ATTENDEES);
      } finally {
        setIsLoading(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      fetchAttendees();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // 2. Powerful Local Filtering Logic (Fail-Safe)
  // Force it to treat 'attendees' as an array, even if it glitches
  const safeAttendees = Array.isArray(attendees) ? attendees : [];

  const filteredAttendees = safeAttendees.filter((attendee) => {
    const matchesTab = activeTab === "ALL" || attendee.status === activeTab;
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      attendee.name.toLowerCase().includes(searchLower) ||
      attendee.id.toLowerCase().includes(searchLower) ||
      attendee.university.toLowerCase().includes(searchLower);

    return matchesTab && matchesSearch;
  });

  // 3. Render List Item
  const renderAttendee = ({ item }: { item: Attendee }) => {
    const isClaimed = item.status === "CLAIMED";

    return (
      <TouchableOpacity
        style={[styles.listItem, { borderBottomColor: theme.border }]}
        activeOpacity={0.7}
        onPress={() => setSelectedAttendee(item)}
      >
        <View style={styles.listLeft}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: isClaimed ? theme.success : theme.textMuted },
            ]}
          />
          <View>
            <Text style={[styles.attendeeName, { color: theme.textMain }]}>
              {item.name}
            </Text>
            <Text
              style={[styles.attendeeSub, { color: theme.textMuted }]}
              numberOfLines={1}
            >
              {item.university} • {item.category}
            </Text>
          </View>
        </View>

        {isClaimed ? (
          <Text style={[styles.timeText, { color: theme.textMuted }]}>
            {item.claimedAt}
          </Text>
        ) : (
          <TouchableOpacity
            style={[styles.manualClaimBtn, { borderColor: theme.primary }]}
            onPress={() => console.log("Trigger Manual Claim API:", item.id)}
          >
            <Text style={[styles.manualClaimText, { color: theme.primary }]}>
              Manual Claim
            </Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.surface }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn}>
          <Feather name="menu" size={24} color={theme.textMain} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.primary }]}>
          Attendee Directory
        </Text>
        <TouchableOpacity style={styles.iconBtn}>
          <Feather name="search" size={24} color={theme.textMain} />
        </TouchableOpacity>
      </View>

      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Search Bar */}
        <View
          style={[styles.searchContainer, { backgroundColor: theme.surface }]}
        >
          <Feather
            name="search"
            size={20}
            color={theme.textMuted}
            style={styles.searchIcon}
          />
          <TextInput
            style={[styles.searchInput, { color: theme.textMain }]}
            placeholder="Search by Name, ID, or University..."
            placeholderTextColor={theme.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Segmented Control Tabs */}
        <View
          style={[styles.tabsContainer, { backgroundColor: theme.surface }]}
        >
          {(["ALL", "CLAIMED", "PENDING"] as FilterTab[]).map((tab) => {
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
                onPress={() => setActiveTab(tab)}
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

        {/* List Content */}
        {isLoading && attendees.length === 0 ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : (
          <FlatList
            data={filteredAttendees}
            keyExtractor={(item) => item.id}
            renderItem={renderAttendee}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* Bottom Sheet Modal for Details */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={!!selectedAttendee}
        onRequestClose={() => setSelectedAttendee(null)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={() => setSelectedAttendee(null)}
          />
          <View
            style={[styles.modalContent, { backgroundColor: theme.background }]}
          >
            {/* Drag Handle */}
            <View style={styles.dragHandle} />

            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.textMain }]}>
                Attendee Details
              </Text>
              <TouchableOpacity onPress={() => setSelectedAttendee(null)}>
                <Feather name="x" size={24} color={theme.textMain} />
              </TouchableOpacity>
            </View>

            {selectedAttendee && (
              <>
                {/* Status Badge */}
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        selectedAttendee.status === "CLAIMED"
                          ? `${theme.success}15`
                          : `${theme.textMuted}15`,
                      borderColor:
                        selectedAttendee.status === "CLAIMED"
                          ? theme.success
                          : theme.textMuted,
                    },
                  ]}
                >
                  <Feather
                    name={
                      selectedAttendee.status === "CLAIMED"
                        ? "check-circle"
                        : "clock"
                    }
                    size={16}
                    color={
                      selectedAttendee.status === "CLAIMED"
                        ? theme.success
                        : theme.textMuted
                    }
                  />
                  <Text
                    style={[
                      styles.statusBadgeText,
                      {
                        color:
                          selectedAttendee.status === "CLAIMED"
                            ? theme.success
                            : theme.textMuted,
                      },
                    ]}
                  >
                    {selectedAttendee.status === "CLAIMED"
                      ? "ALREADY CLAIMED"
                      : "PENDING CLAIM"}
                  </Text>
                </View>

                {/* Attendee Info */}
                <Text style={[styles.detailName, { color: theme.textMain }]}>
                  {selectedAttendee.name}
                </Text>
                <Text style={[styles.detailSub, { color: theme.textMuted }]}>
                  ID: #{selectedAttendee.id.substring(0, 14).toUpperCase()} •{" "}
                  {selectedAttendee.university.split(" ").slice(-2).join(" ")}
                </Text>

                {/* Audit Trail */}
                <Text style={[styles.auditTitle, { color: theme.textMuted }]}>
                  AUDIT TRAIL
                </Text>
                <View style={styles.auditContainer}>
                  {/* Node 1: Generated */}
                  <View style={styles.auditNode}>
                    <View style={styles.auditTimeline}>
                      <View
                        style={[
                          styles.auditDot,
                          { backgroundColor: `${theme.primary}50` },
                        ]}
                      />
                      <View
                        style={[
                          styles.auditLine,
                          { backgroundColor: `${theme.primary}20` },
                        ]}
                      />
                    </View>
                    <View style={styles.auditDetails}>
                      <Text
                        style={[styles.auditTime, { color: theme.textMain }]}
                      >
                        11:00 AM
                      </Text>
                      <Text
                        style={[styles.auditDesc, { color: theme.textMuted }]}
                      >
                        Ticket Generated by System
                      </Text>
                    </View>
                  </View>

                  {/* Node 2: Scanned (Only if claimed) */}
                  {selectedAttendee.status === "CLAIMED" && (
                    <View style={styles.auditNode}>
                      <View style={styles.auditTimeline}>
                        <View
                          style={[
                            styles.auditDot,
                            { backgroundColor: theme.primary },
                          ]}
                        />
                      </View>
                      <View style={styles.auditDetails}>
                        <Text
                          style={[styles.auditTime, { color: theme.textMain }]}
                        >
                          {selectedAttendee.claimedAt}
                        </Text>
                        <Text
                          style={[styles.auditDesc, { color: theme.textMuted }]}
                        >
                          Scanned by Volunteer:{" "}
                          <Text
                            style={{ color: theme.primary, fontWeight: "600" }}
                          >
                            {selectedAttendee.scannedBy || "System"}
                          </Text>
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// -----------------------------------------------------
// STYLES
// -----------------------------------------------------
const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  centerContent: { flex: 1, justifyContent: "center", alignItems: "center" },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SIZES.padding,
    paddingVertical: 16,
  },
  iconBtn: { padding: 4 },
  headerTitle: { ...FONTS.header, fontSize: 22 },

  // Search
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: SIZES.padding,
    marginTop: 12,
    borderRadius: SIZES.radius,
    paddingHorizontal: 16,
    height: 50,
  },
  searchIcon: { marginRight: 12 },
  searchInput: { flex: 1, ...FONTS.body, fontSize: 16, height: "100%" },

  // Tabs
  tabsContainer: {
    flexDirection: "row",
    marginHorizontal: SIZES.padding,
    marginTop: 16,
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

  // List
  listContent: {
    paddingHorizontal: SIZES.padding,
    paddingTop: 8,
    paddingBottom: 100,
  },
  listItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  listLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingRight: 16,
  },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 16 },
  attendeeName: {
    ...FONTS.body,
    fontWeight: "500",
    fontSize: 16,
    marginBottom: 2,
  },
  attendeeSub: { ...FONTS.muted, fontSize: 13 },
  timeText: { ...FONTS.muted, fontSize: 13 },
  manualClaimBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  manualClaimText: { ...FONTS.body, fontSize: 12, fontWeight: "600" },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: SIZES.padding,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
    minHeight: "50%",
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#E2E8F0",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 24,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: { ...FONTS.header, fontSize: 20 },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  statusBadgeText: {
    ...FONTS.body,
    fontWeight: "700",
    fontSize: 12,
    marginLeft: 6,
    letterSpacing: 0.5,
  },
  detailName: { ...FONTS.header, fontSize: 26, marginBottom: 4 },
  detailSub: { ...FONTS.body, fontSize: 15, marginBottom: 32 },

  // Audit Trail
  auditTitle: {
    ...FONTS.muted,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 16,
  },
  auditContainer: { marginLeft: 8 },
  auditNode: { flexDirection: "row", marginBottom: 4 },
  auditTimeline: { alignItems: "center", width: 20, marginRight: 16 },
  auditDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  auditLine: { width: 2, flex: 1, marginVertical: 4 },
  auditDetails: { flex: 1, paddingBottom: 24 },
  auditTime: { ...FONTS.body, fontSize: 16, marginBottom: 4 },
  auditDesc: { ...FONTS.body, fontSize: 14, lineHeight: 20 },
});

// -----------------------------------------------------
// MOCK DATA (Used as a fallback if API fails)
// -----------------------------------------------------
const MOCK_ATTENDEES: Attendee[] = [
  {
    id: "dx-2024-00129",
    name: "Rakib Ahmed",
    university: "University of Creative Technology",
    category: "Datathon",
    status: "CLAIMED",
    claimedAt: "1:45 PM",
    scannedBy: "Tanvir",
  },
  {
    id: "dx-2024-00130",
    name: "Sarah Jenkins",
    university: "MIT",
    category: "AI Summit",
    status: "PENDING",
  },
  {
    id: "dx-2024-00131",
    name: "Tanvir Hossein",
    university: "BUET",
    category: "Engineering Expo",
    status: "CLAIMED",
    claimedAt: "12:30 PM",
    scannedBy: "System",
  },
  {
    id: "dx-2024-00132",
    name: "Ayesha Rahman",
    university: "Ahsanullah University",
    category: "Datathon",
    status: "PENDING",
  },
  {
    id: "dx-2024-00133",
    name: "John Doe",
    university: "University of Dhaka",
    category: "Hackathon",
    status: "CLAIMED",
    claimedAt: "11:15 AM",
    scannedBy: "Rakib",
  },
];
