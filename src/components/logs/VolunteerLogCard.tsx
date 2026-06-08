import { AppTheme, FONTS, SIZES } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { FormattedLog } from "@/types";
import { formatDate, formatTime } from "@/utils/formatDate";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

const getStatusVisuals = (status: string, theme: AppTheme) => {
  const normalizedStatus = status.toUpperCase();
  if (
    normalizedStatus.includes("DUPLICATE") ||
    normalizedStatus.includes("ALREADY_CLAIMED")
  ) {
    return { color: theme.error, icon: "x-circle", bg: `${theme.error}10` };
  }
  if (normalizedStatus.includes("SUCCESS")) {
    return {
      color: theme.success,
      icon: "check-circle",
      bg: `${theme.success}10`,
    };
  }
  return {
    color: "#D97706",
    icon: "alert-triangle",
    bg: "rgba(217,119,6,0.1)",
  };
};

interface VolunteerLogCardProps {
  item: FormattedLog;
}

const VolunteerLogCard = React.memo(
  ({ item }: VolunteerLogCardProps): React.ReactElement => {
    const theme = useTheme();
    const visual = getStatusVisuals(item.status, theme);

    return (
      <View
        style={[
          styles.card,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        {/* Top Header Row */}
        <View style={styles.cardHeader}>
          <View style={[styles.statusBadge, { backgroundColor: visual.bg }]}>
            <Feather name={visual.icon as any} size={13} color={visual.color} />
            <Text style={[styles.statusText, { color: visual.color }]}>
              {item.status.replace(/_/g, " ")}
            </Text>
          </View>
          <Text style={[styles.timeText, { color: theme.textMuted }]}>
            {formatDate(item.scannedAt)} • {formatTime(item.scannedAt)}
          </Text>
        </View>

        {/* Main Content Area */}
        <View style={styles.cardBody}>
          <View style={styles.metaLabelRow}>
            <Text style={[styles.metaLabel, { color: theme.textMuted }]}>
              ATTENDEE PARTICIPANT
            </Text>
            {item.category ? (
              <View
                style={[
                  styles.categoryBadge,
                  { backgroundColor: `${theme.primary}10` },
                ]}
              >
                <Text
                  style={[styles.categoryBadgeText, { color: theme.primary }]}
                >
                  {item.category}
                </Text>
              </View>
            ) : null}
          </View>

          <Text
            style={[styles.attendeeName, { color: theme.textMain }]}
            numberOfLines={1}
          >
            {item.attendeeName || "Unknown / Invalid Token"}
          </Text>

          <View style={styles.infoGrid}>
            {item.attendeeEmail ? (
              <View style={styles.infoRow}>
                <Feather
                  name="mail"
                  size={12}
                  color={theme.textMuted}
                  style={styles.infoIcon}
                />
                <Text
                  style={[styles.infoText, { color: theme.textMuted }]}
                  numberOfLines={1}
                >
                  {item.attendeeEmail}
                </Text>
              </View>
            ) : null}

            {item.studentId ? (
              <View style={styles.infoRow}>
                <Feather
                  name="credit-card"
                  size={12}
                  color={theme.textMuted}
                  style={styles.infoIcon}
                />
                <Text style={[styles.infoText, { color: theme.textMuted }]}>
                  ID: {item.studentId}{" "}
                  {item.section
                    ? `| Sem/Sec: ${item.semester}/${item.section}`
                    : ""}
                </Text>
              </View>
            ) : null}

            {item.university ? (
              <View style={styles.infoRow}>
                <Feather
                  name="map-pin"
                  size={12}
                  color={theme.textMuted}
                  style={styles.infoIcon}
                />
                <Text
                  style={[styles.infoText, { color: theme.textMuted }]}
                  numberOfLines={1}
                >
                  {item.university}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>
    );
  },
);

export default VolunteerLogCard;

const styles = StyleSheet.create({
  card: {
    borderRadius: SIZES.radius,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.04)",
    paddingBottom: 12,
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  statusText: {
    ...FONTS.body,
    fontWeight: "800",
    fontSize: 11,
    marginLeft: 6,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  timeText: {
    ...FONTS.body,
    fontSize: 12,
    fontWeight: "500",
  },
  cardBody: {
    flexDirection: "column",
  },
  metaLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  metaLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },
  attendeeName: {
    ...FONTS.body,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
  },
  infoGrid: {
    gap: 6,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoIcon: {
    marginRight: 8,
    width: 14,
  },
  infoText: {
    ...FONTS.body,
    fontSize: 13,
    fontWeight: "500",
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
  },
});
