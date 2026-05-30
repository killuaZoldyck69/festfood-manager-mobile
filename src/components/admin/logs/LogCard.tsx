import { FONTS, SIZES } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";

export interface ScanLog {
  id: string;
  status: string;
  scannedToken: string;
  scannedAt: string;
  volunteerName: string;
  attendeeName: string | null;
  volunteerRole?: string | null;
  attendeeUniversity?: string | null;
  attendeeCategory?: string | null;
  attendeeEmail?: string | null;
  attendeeStudentId?: string | null;
}

const formatTime = (isoString: string) => {
  const date = new Date(isoString);
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const formatDate = (isoString: string) => {
  return new Date(isoString).toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
};

const getStatusVisuals = (status: string, theme: any) => {
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

const LogCard = React.memo(({ item }: { item: ScanLog }) => {
  const theme = useTheme();
  const visual = getStatusVisuals(item.status, theme);

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
          <Text
            style={[styles.attendeeName, { color: theme.textMain }]}
            numberOfLines={1}
          >
            {item.attendeeName || "Unknown / Invalid Token"}
          </Text>
          {item.attendeeStudentId && (
            <Text
              style={[styles.traceText, { color: theme.textMuted }]}
              numberOfLines={1}
            >
              ID: {item.attendeeStudentId}
            </Text>
          )}
          {item.attendeeEmail && (
            <Text
              style={[
                styles.traceText,
                { color: theme.textMuted, marginBottom: 4 },
              ]}
              numberOfLines={1}
            >
              {item.attendeeEmail}
            </Text>
          )}
          <Text
            style={[styles.attendeeUniversity, { color: theme.textMuted }]}
            numberOfLines={1}
          >
            {item.attendeeUniversity || "Missing Info"}
          </Text>
          <View style={styles.metaRow}>
            {item.attendeeCategory && (
              <View
                style={[
                  styles.categoryBadge,
                  { backgroundColor: `${theme.primary}15` },
                ]}
              >
                <Text
                  style={[styles.categoryBadgeText, { color: theme.primary }]}
                >
                  {item.attendeeCategory}
                </Text>
              </View>
            )}
          </View>
          <Text style={[styles.tokenText, { color: theme.textMuted }]}>
            Token: {item.scannedToken.substring(0, 8).toUpperCase()}...
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.scannerInfo}>
          <Text style={[styles.label, { color: theme.textMuted }]}>
            ACTION BY
          </Text>
          <Text
            style={[styles.attendeeName, { color: theme.textMain }]}
            numberOfLines={1}
          >
            {item.volunteerName || "System"}
          </Text>
          {item.volunteerRole && (
            <View
              style={[
                styles.roleBadge,
                {
                  backgroundColor:
                    item.volunteerRole === "ADMIN"
                      ? `${theme.primary}15`
                      : `${theme.success}15`,
                },
              ]}
            >
              <Text
                style={[
                  styles.roleBadgeText,
                  {
                    color:
                      item.volunteerRole === "ADMIN"
                        ? theme.primary
                        : theme.success,
                  },
                ]}
              >
                {item.volunteerRole}
              </Text>
            </View>
          )}
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
  traceText: { ...FONTS.body, fontSize: 13, fontWeight: "500", lineHeight: 17 },
  scannerInfo: { flex: 0.9, paddingLeft: 12, justifyContent: "flex-start" },
  divider: { width: 1, backgroundColor: "#E2E8F0", marginHorizontal: 6 },
  label: {
    ...FONTS.body,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 6,
  },
  attendeeName: {
    ...FONTS.body,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
  },
  attendeeUniversity: { ...FONTS.muted, fontSize: 12, marginBottom: 8 },
  metaRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  categoryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
  },
  categoryBadgeText: {
    ...FONTS.body,
    fontSize: 9,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginTop: 6,
  },
  roleBadgeText: {
    ...FONTS.body,
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  tokenText: {
    ...FONTS.body,
    fontSize: 11,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
});
