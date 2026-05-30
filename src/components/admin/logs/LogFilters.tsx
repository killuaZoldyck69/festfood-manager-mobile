import { FONTS, SIZES } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { Feather, Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export type FilterTab =
  | "ALL"
  | "SUCCESS"
  | "DUPLICATE"
  | "INVALID"
  | "MANUAL_OVERRIDE";

interface LogFiltersProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  activeTab: FilterTab;
  setActiveTab: (val: FilterTab) => void;
  selectedCategory: string;
  setSelectedCategory: (val: string) => void;
  selectedVolunteerEmail: string;
  setSelectedVolunteerEmail: (val: string) => void;
  filterOptions: { categories: any[]; volunteers: any[] };
  clearFilters: () => void;
}

export default function LogFilters({
  searchQuery,
  setSearchQuery,
  activeTab,
  setActiveTab,
  selectedCategory,
  setSelectedCategory,
  selectedVolunteerEmail,
  setSelectedVolunteerEmail,
  filterOptions,
  clearFilters,
}: LogFiltersProps) {
  const theme = useTheme();

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isVolDropdownOpen, setIsVolDropdownOpen] = useState(false);

  const hasActiveFilters =
    selectedCategory !== "ALL" ||
    selectedVolunteerEmail !== "ALL" ||
    searchQuery.trim() !== "" ||
    activeTab !== "ALL";

  return (
    <View style={styles.filterControlPanel}>
      <View style={styles.searchRow}>
        <View
          style={[
            styles.searchBarContainer,
            { backgroundColor: theme.surface },
          ]}
        >
          <Feather
            name="search"
            size={18}
            color={theme.textMuted}
            style={styles.searchIcon}
          />
          <TextInput
            style={[styles.searchInput, { color: theme.textMain }]}
            placeholder="Search Name, Email, Student ID..."
            placeholderTextColor={theme.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Feather
                name="x"
                size={16}
                color={theme.textMuted}
                style={{ marginRight: 8 }}
              />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[styles.advancedToggleBtn, { backgroundColor: theme.surface }]}
          onPress={() => {
            setShowAdvanced(!showAdvanced);
            setIsVolDropdownOpen(false);
          }}
        >
          <View>
            <Ionicons
              name={hasActiveFilters ? "funnel" : "funnel-outline"}
              size={20}
              color={
                hasActiveFilters || showAdvanced
                  ? theme.primary
                  : theme.textMuted
              }
            />
            {hasActiveFilters && (
              <View
                style={[
                  styles.activeDot,
                  { backgroundColor: theme.error, borderColor: theme.surface },
                ]}
              />
            )}
          </View>
        </TouchableOpacity>
      </View>

      {showAdvanced && (
        <View
          style={[
            styles.advancedPanelBody,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <View style={styles.advancedPanelHeader}>
            <Text
              style={[
                styles.panelLabel,
                { color: theme.textMain, marginBottom: 0 },
              ]}
            >
              Filter By Category
            </Text>
            {hasActiveFilters && (
              <TouchableOpacity
                style={[
                  styles.resetBtn,
                  { backgroundColor: `${theme.error}15` },
                ]}
                onPress={clearFilters}
              >
                <Feather
                  name="refresh-ccw"
                  size={12}
                  color={theme.error}
                  style={{ marginRight: 4 }}
                />
                <Text style={[styles.resetBtnText, { color: theme.error }]}>
                  Reset All
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryPillScroll}
          >
            {filterOptions.categories.map((cat) => {
              const isCatActive = selectedCategory === cat.name;
              return (
                <TouchableOpacity
                  key={cat.name}
                  style={[
                    styles.categoryPill,
                    { backgroundColor: theme.background },
                    isCatActive && { backgroundColor: theme.primary },
                  ]}
                  onPress={() => setSelectedCategory(cat.name)}
                >
                  <Text
                    style={[
                      styles.categoryPillText,
                      { color: isCatActive ? "#FFF" : theme.textMuted },
                    ]}
                  >
                    {cat.name === "ALL"
                      ? "All Categories"
                      : `${cat.name} (${cat.count})`}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Text
            style={[
              styles.panelLabel,
              { color: theme.textMain, marginTop: 16 },
            ]}
          >
            Filter By Staff Member
          </Text>
          <TouchableOpacity
            style={[
              styles.dropdownTrigger,
              { backgroundColor: theme.background, borderColor: theme.border },
            ]}
            activeOpacity={0.7}
            onPress={() => setIsVolDropdownOpen(!isVolDropdownOpen)}
          >
            <Text
              style={[
                styles.dropdownTriggerText,
                {
                  color:
                    selectedVolunteerEmail === "ALL"
                      ? theme.textMuted
                      : theme.textMain,
                },
              ]}
              numberOfLines={1}
            >
              {selectedVolunteerEmail === "ALL"
                ? "All Volunteers"
                : filterOptions.volunteers.find(
                    (v) => v.email === selectedVolunteerEmail,
                  )?.name || selectedVolunteerEmail}
            </Text>
            <Feather
              name={isVolDropdownOpen ? "chevron-up" : "chevron-down"}
              size={18}
              color={theme.textMuted}
            />
          </TouchableOpacity>

          {isVolDropdownOpen && (
            <View
              style={[
                styles.dropdownListContainer,
                {
                  backgroundColor: theme.background,
                  borderColor: theme.border,
                },
              ]}
            >
              <ScrollView
                style={{ maxHeight: 220 }}
                nestedScrollEnabled
                showsVerticalScrollIndicator
              >
                {filterOptions.volunteers.map((vol, index) => {
                  const isVolActive =
                    selectedVolunteerEmail === (vol.email || "ALL");
                  const displayText =
                    vol.name === "ALL"
                      ? "All Volunteers"
                      : `${index}. ${vol.name} (${vol.email}) - ${vol.count} scans`;

                  return (
                    <TouchableOpacity
                      key={vol.email || vol.name}
                      style={[
                        styles.dropdownItem,
                        { borderBottomColor: theme.border },
                        isVolActive && {
                          backgroundColor: `${theme.primary}10`,
                        },
                      ]}
                      onPress={() => {
                        setSelectedVolunteerEmail(vol.email || "ALL");
                        setIsVolDropdownOpen(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownItemText,
                          {
                            color: isVolActive ? theme.primary : theme.textMain,
                            fontWeight: isVolActive ? "700" : "500",
                          },
                        ]}
                      >
                        {displayText}
                      </Text>
                      {isVolActive && (
                        <Feather name="check" size={16} color={theme.primary} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>
      )}

      <View style={styles.tabsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScrollContent}
        >
          {[
            { id: "ALL", icon: "layers", activeColor: theme.primary },
            { id: "SUCCESS", icon: "check-circle", activeColor: theme.success },
            { id: "DUPLICATE", icon: "copy", activeColor: theme.error },
            { id: "INVALID", icon: "alert-triangle", activeColor: "#D97706" },
            { id: "MANUAL_OVERRIDE", icon: "edit-3", activeColor: "#8B5CF6" },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.tab,
                  { backgroundColor: theme.surface },
                  isActive && { backgroundColor: `${tab.activeColor}15` },
                ]}
                onPress={() => setActiveTab(tab.id as FilterTab)}
              >
                <Feather
                  name={tab.icon as any}
                  size={14}
                  color={isActive ? tab.activeColor : theme.textMuted}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    styles.tabText,
                    {
                      color: isActive ? tab.activeColor : theme.textMuted,
                      fontWeight: isActive ? "800" : "600",
                    },
                  ]}
                >
                  {tab.id.replace("_", " ")}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  filterControlPanel: { paddingHorizontal: SIZES.padding, marginBottom: 12 },
  searchRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    borderRadius: SIZES.radius,
    height: 48,
    paddingHorizontal: 12,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, ...FONTS.body, fontSize: 15, height: "100%" },
  advancedToggleBtn: {
    height: 48,
    width: 48,
    borderRadius: SIZES.radius,
    alignItems: "center",
    justifyContent: "center",
  },
  activeDot: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
  },
  advancedPanelBody: {
    marginTop: 8,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    padding: 14,
  },
  advancedPanelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  panelLabel: {
    ...FONTS.body,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  resetBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  resetBtnText: {
    ...FONTS.body,
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  categoryPillScroll: { gap: 8, paddingTop: 4 },
  categoryPill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  categoryPillText: { ...FONTS.body, fontSize: 12, fontWeight: "600" },
  dropdownTrigger: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
  },
  dropdownTriggerText: {
    ...FONTS.body,
    fontSize: 13,
    flex: 1,
    paddingRight: 8,
  },
  dropdownListContainer: {
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 4,
    overflow: "hidden",
  },
  dropdownItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  dropdownItemText: { ...FONTS.body, fontSize: 13 },
  tabsWrapper: { marginTop: 12 },
  tabsScrollContent: { paddingVertical: 4 },
  tab: {
    flexDirection: "row",
    paddingHorizontal: 18,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: SIZES.radius - 4,
    marginRight: 10,
  },
  tabText: { ...FONTS.body, fontSize: 13, letterSpacing: 0.5 },
});
