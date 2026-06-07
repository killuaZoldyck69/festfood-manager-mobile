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

export interface DirectoryFilterAggregation {
  categories: { name: string; count: number }[];
  universities: { name: string; count: number }[];
}

interface FilterProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  activeTab: string;
  setActiveTab: (val: string) => void;
  selectedCategory: string;
  setSelectedCategory: (val: string) => void;
  selectedUniversity: string;
  setSelectedUniversity: (val: string) => void;
  filterOptions: DirectoryFilterAggregation;
  clearFilters: () => void;
}

export default function DirectoryFilters({
  searchQuery,
  setSearchQuery,
  activeTab,
  setActiveTab,
  selectedCategory,
  setSelectedCategory,
  selectedUniversity,
  setSelectedUniversity,
  filterOptions,
  clearFilters,
}: FilterProps): React.ReactElement {
  const theme = useTheme();

  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [isUniDropdownOpen, setIsUniDropdownOpen] = useState<boolean>(false);

  const hasActiveFilters =
    selectedCategory !== "ALL" ||
    selectedUniversity !== "ALL" ||
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
            style={{ marginRight: 8 }}
          />
          <TextInput
            style={[styles.searchInput, { color: theme.textMain }]}
            placeholder="Search Name, ID, or Email..."
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
            setIsUniDropdownOpen(false);
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
            contentContainerStyle={styles.pillScroll}
          >
            {filterOptions.categories.map((cat) => {
              const isCatActive = selectedCategory === cat.name;
              return (
                <TouchableOpacity
                  key={cat.name}
                  style={[
                    styles.filterPill,
                    { backgroundColor: theme.background },
                    isCatActive && { backgroundColor: theme.primary },
                  ]}
                  onPress={() => setSelectedCategory(cat.name)}
                >
                  <Text
                    style={[
                      styles.filterPillText,
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
            Filter By University
          </Text>
          <TouchableOpacity
            style={[
              styles.dropdownTrigger,
              { backgroundColor: theme.background, borderColor: theme.border },
            ]}
            activeOpacity={0.7}
            onPress={() => setIsUniDropdownOpen(!isUniDropdownOpen)}
          >
            <Text
              style={[
                styles.dropdownTriggerText,
                {
                  color:
                    selectedUniversity === "ALL"
                      ? theme.textMuted
                      : theme.textMain,
                },
              ]}
              numberOfLines={1}
            >
              {selectedUniversity === "ALL"
                ? "All Universities"
                : selectedUniversity}
            </Text>
            <Feather
              name={isUniDropdownOpen ? "chevron-up" : "chevron-down"}
              size={18}
              color={theme.textMuted}
            />
          </TouchableOpacity>

          {isUniDropdownOpen && (
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
                {filterOptions.universities.map((uni, index) => {
                  const isUniActive = selectedUniversity === uni.name;
                  const displayText =
                    uni.name === "ALL"
                      ? "All Universities"
                      : `${index + 1}. ${uni.name} (${uni.count})`;
                  return (
                    <TouchableOpacity
                      key={uni.name}
                      style={[
                        styles.dropdownItem,
                        { borderBottomColor: theme.border },
                        isUniActive && {
                          backgroundColor: `${theme.primary}10`,
                        },
                      ]}
                      onPress={() => {
                        setSelectedUniversity(uni.name);
                        setIsUniDropdownOpen(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownItemText,
                          {
                            color: isUniActive ? theme.primary : theme.textMain,
                            fontWeight: isUniActive ? "700" : "500",
                          },
                        ]}
                      >
                        {displayText}
                      </Text>
                      {isUniActive && (
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
            { id: "ALL", icon: "users", activeColor: theme.primary },
            { id: "CLAIMED", icon: "check-circle", activeColor: theme.success },
            { id: "PENDING", icon: "clock", activeColor: "#D97706" },
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
                onPress={() => setActiveTab(tab.id)}
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
                  {tab.id}
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
  filterControlPanel: {
    paddingHorizontal: SIZES.padding,
    marginBottom: 8,
    marginTop: 8,
  },
  searchRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    borderRadius: SIZES.radius,
    height: 48,
    paddingHorizontal: 12,
  },
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
  pillScroll: { gap: 8, paddingTop: 4 },
  filterPill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  filterPillText: { ...FONTS.body, fontSize: 12, fontWeight: "600" },
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
  tabsWrapper: { marginBottom: 8 },
  tabsScrollContent: { paddingHorizontal: SIZES.padding, paddingVertical: 4 },
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
