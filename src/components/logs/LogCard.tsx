import { AppTheme, FONTS, SIZES } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { FormattedLog } from "@/types";
import { formatDate, formatTime } from "@/utils/formatDate";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

const getStatusVisuals = (
  status: string,
  theme: AppTheme,
): { color: string; icon: string; bg: string } => {
  const normalizedStatus = status.toUpperCase();
  if (
    normalizedStatus.includes("DUPLICATE") ||
    normalizedStatus.includes("ALREADY_CLAIMED")
  ) {
    return { color: theme.error, icon: "x-circle", bg: `${theme.error}15` };
  }
  if (normalizedStatus.includes("SUCCESS")) {
    return {
      color: theme.success,
      icon: "check-circle",
      bg: `${theme.success}15`,
    };
  }
  if (normalizedStatus.includes("MANUAL_OVERRIDE")) {
    return { color: theme.primary, icon: "edit-3", bg: `${theme.primary}15` };
  }
  return {
    color: "#F59E0B",
    icon: "alert-triangle",
    bg: "rgba(245,158,11,0.15)",
  };
};

interface LogCardProps {
  item: FormattedLog;
}

const LogCard = React.memo(({ item }: LogCardProps): React.ReactElement => {
  const theme = useTheme();
  const visual = getStatusVisuals(item.status, theme);

  const renderInfoRow = (
    icon: any,
    text: string | null | undefined,
    isMain: boolean = false,
  ) => {
    if (!text) return null;
    return (
      <View style={styles.infoRow}>
        <View style={styles.iconWrapper}>
          <Feather
            name={icon}
            size={isMain ? 14 : 12}
            color={isMain ? theme.textMain : theme.textMuted}
          />
        </View>
        <Text
          style={[
            isMain ? styles.attendeeName : styles.subText,
            { color: isMain ? theme.textMain : theme.textMuted, flex: 1 },
          ]}
          numberOfLines={1}
        >
          {text}
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.logCard, { backgroundColor: theme.surface }]}>
      <View style={styles.logHeader}>
        <View style={[styles.statusBadge, { backgroundColor: visual.bg }]}>
          <Feather name={visual.icon as any} size={14} color={visual.color} />
          <Text style={[styles.statusText, { color: visual.color }]}>
            {item.status.replace(/_/g, " ")}
          </Text>
        </View>
        <Text style={[styles.timeText, { color: theme.textMuted }]}>
          {formatDate(item.scannedAt)} • {formatTime(item.scannedAt)}
        </Text>
      </View>

      <View style={styles.logBody}>
        <View style={styles.participantInfo}>
          <Text style={[styles.label, { color: theme.textMuted }]}>
            ATTENDEE
          </Text>

          {/* ALL ATTENDEE INFO RENDERED HERE */}
          {renderInfoRow(
            "user",
            item.attendeeName || "Unknown / Invalid Token",
            true,
          )}
          {renderInfoRow("phone", item.phoneNumber)}
          {renderInfoRow("mail", item.attendeeEmail)}
          {renderInfoRow(
            "credit-card",
            item.studentId ? `ID: ${item.studentId}` : null,
          )}
          {/* {renderInfoRow("layers", item.department)}
          {renderInfoRow(
            "clock",
            item.semester || item.section
              ? `Sem: ${item.semester || "N/A"} ${item.section ? `• Sec: ${item.section}` : ""}`
              : null,
          )}
          {renderInfoRow("map-pin", item.university)} */}

          {item.category ? (
            <View
              style={[
                styles.categoryBadge,
                { backgroundColor: `${theme.primary}15` },
              ]}
            >
              <Feather
                name="tag"
                size={10}
                color={theme.primary}
                style={{ marginRight: 4 }}
              />
              <Text
                style={[styles.categoryBadgeText, { color: theme.primary }]}
              >
                {item.category}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.divider} />

        <View style={styles.scannerInfo}>
          <Text style={[styles.label, { color: theme.textMuted }]}>
            ACTION BY
          </Text>

          {renderInfoRow("shield", item.volunteerName || "System", true)}
          {renderInfoRow("mail", item.volunteerEmail)}
        </View>
      </View>
    </View>
  );
});

export default LogCard;

const styles = StyleSheet.create({
  logCard: {
    borderRadius: SIZES.radius,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  logHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
    paddingBottom: 10,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    ...FONTS.body,
    fontWeight: "700",
    fontSize: 11,
    marginLeft: 6,
    letterSpacing: 0.5,
  },
  timeText: { ...FONTS.body, fontSize: 12, fontWeight: "500" },
  logBody: { flexDirection: "row", paddingTop: 2 },
  participantInfo: { flex: 1.3, justifyContent: "flex-start" },
  scannerInfo: { flex: 0.9, paddingLeft: 12, justifyContent: "flex-start" },
  divider: { width: 1, backgroundColor: "#E2E8F0", marginHorizontal: 6 },
  label: {
    ...FONTS.body,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 8,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  iconWrapper: {
    width: 20,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  attendeeName: {
    ...FONTS.body,
    fontSize: 14,
    fontWeight: "700",
  },
  subText: {
    ...FONTS.body,
    fontSize: 12,
  },

  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 6,
    marginLeft: 0,
  },
  categoryBadgeText: {
    ...FONTS.body,
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
