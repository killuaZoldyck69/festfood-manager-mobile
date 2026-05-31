import { FONTS } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface AttendeeCardProps {
  item: any;
  onSelect: (item: any) => void;
  onManualClaim: (item: any) => void;
}

const formatTime = (isoString: string | null) => {
  if (!isoString) return "";
  return new Date(isoString).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const AttendeeCard = React.memo(
  ({ item, onSelect, onManualClaim }: AttendeeCardProps) => {
    const theme = useTheme();
    const isClaimed = item.foodClaimed;

    return (
      <TouchableOpacity
        style={[styles.listItem, { borderBottomColor: theme.border }]}
        activeOpacity={0.7}
        onPress={() => onSelect(item)}
      >
        <View style={styles.listLeft}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: isClaimed ? theme.success : theme.textMuted },
            ]}
          />
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text
              style={[styles.attendeeName, { color: theme.textMain }]}
              numberOfLines={1}
            >
              {item.name}
            </Text>

            <Text
              style={[styles.traceText, { color: theme.textMuted }]}
              numberOfLines={1}
            >
              ID: {item.studentId}
            </Text>

            {/* 🔴 NEW: Semester & Section (Defensive Render) */}
            {(item.semester || item.section) && (
              <Text
                style={[styles.traceText, { color: theme.textMuted }]}
                numberOfLines={1}
              >
                Sem & Sec: {item.semester || "N/A"} - {item.section || "N/A"}
              </Text>
            )}

            <View style={styles.listSubRow}>
              <Text
                style={[styles.attendeeUniversity, { color: theme.textMuted }]}
                numberOfLines={1}
              >
                {item.university || "Unknown University"}
              </Text>
            </View>
            <View
              style={[
                styles.categoryBadge,
                { backgroundColor: `${theme.primary}15` },
              ]}
            >
              <Text
                style={[styles.categoryBadgeText, { color: theme.primary }]}
              >
                {item.category || "Participant"}
              </Text>
            </View>
          </View>
        </View>

        {isClaimed ? (
          <Text style={[styles.timeText, { color: theme.textMuted }]}>
            {formatTime(item.claimedAt)}
          </Text>
        ) : (
          <TouchableOpacity
            style={[
              styles.manualClaimBtn,
              { borderColor: theme.border, backgroundColor: theme.surface },
            ]}
            onPress={() => onManualClaim(item)}
          >
            <Text style={[styles.manualClaimText, { color: theme.primary }]}>
              Manual Claim
            </Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  },
);

export default AttendeeCard;

const styles = StyleSheet.create({
  listItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  listLeft: { flexDirection: "row", alignItems: "flex-start", flex: 1 },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 16,
    marginTop: 6,
  },
  attendeeName: {
    ...FONTS.body,
    fontWeight: "700",
    fontSize: 16,
    marginBottom: 4,
  },
  traceText: { ...FONTS.body, fontSize: 13, fontWeight: "500", lineHeight: 17 },
  listSubRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  attendeeUniversity: {
    ...FONTS.muted,
    fontSize: 12,
    flexShrink: 1,
    marginTop: 2,
  },
  categoryBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryBadgeText: {
    ...FONTS.body,
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  timeText: { ...FONTS.muted, fontSize: 13, fontWeight: "600" },
  manualClaimBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  manualClaimText: { ...FONTS.body, fontSize: 12, fontWeight: "700" },
});
