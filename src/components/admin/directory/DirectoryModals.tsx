import { FONTS, SIZES } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface ModalsProps {
  selectedAttendee: any;
  setSelectedAttendee: (val: any) => void;
  claimConfirmAttendee: any;
  setClaimConfirmAttendee: (val: any) => void;
  errorModalInfo: any;
  setErrorModalInfo: (val: any) => void;
  handleManualClaim: () => void;
}

const formatDateTime = (isoString: string | null) => {
  if (!isoString) return "Unknown Date";
  const date = new Date(isoString);
  return `${date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })} at ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })}`;
};

export default function DirectoryModals({
  selectedAttendee,
  setSelectedAttendee,
  claimConfirmAttendee,
  setClaimConfirmAttendee,
  errorModalInfo,
  setErrorModalInfo,
  handleManualClaim,
}: ModalsProps) {
  const theme = useTheme();

  return (
    <>
      {/* 1. Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent
        visible={!!claimConfirmAttendee}
        onRequestClose={() => setClaimConfirmAttendee(null)}
      >
        <View style={styles.centerModalOverlay}>
          <View
            style={[
              styles.confirmModalCard,
              { backgroundColor: theme.background },
            ]}
          >
            <View
              style={[
                styles.warningIconBg,
                { backgroundColor: `${theme.primary}15` },
              ]}
            >
              <Feather name="alert-circle" size={32} color={theme.primary} />
            </View>
            <Text style={[styles.confirmModalTitle, { color: theme.textMain }]}>
              Manual Override
            </Text>
            <Text style={[styles.confirmModalText, { color: theme.textMuted }]}>
              Are you sure you want to mark{" "}
              <Text style={{ color: theme.textMain, fontWeight: "700" }}>
                {claimConfirmAttendee?.name}
              </Text>
              's ticket as claimed?
            </Text>
            <View style={styles.confirmModalActions}>
              <TouchableOpacity
                style={[
                  styles.confirmBtn,
                  styles.cancelBtn,
                  { borderColor: theme.border },
                ]}
                onPress={() => setClaimConfirmAttendee(null)}
              >
                <Text style={[styles.cancelBtnText, { color: theme.textMain }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, { backgroundColor: theme.primary }]}
                onPress={handleManualClaim}
              >
                <Text style={styles.acceptBtnText}>Confirm Claim</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 2. Error Modal */}
      <Modal
        animationType="fade"
        transparent
        visible={!!errorModalInfo}
        onRequestClose={() => setErrorModalInfo(null)}
      >
        <View style={styles.centerModalOverlay}>
          <View
            style={[
              styles.confirmModalCard,
              { backgroundColor: theme.background },
            ]}
          >
            <View
              style={[
                styles.warningIconBg,
                {
                  backgroundColor:
                    errorModalInfo?.type === "OUT_OF_STOCK"
                      ? "#334155"
                      : `${theme.error}15`,
                },
              ]}
            >
              <Feather
                name={
                  errorModalInfo?.type === "OUT_OF_STOCK"
                    ? "inbox"
                    : "alert-triangle"
                }
                size={32}
                color={
                  errorModalInfo?.type === "OUT_OF_STOCK" ? "#FFF" : theme.error
                }
              />
            </View>
            <Text
              style={[
                styles.confirmModalTitle,
                { color: theme.textMain, textAlign: "center" },
              ]}
            >
              {errorModalInfo?.title}
            </Text>
            <Text
              style={[
                styles.confirmModalText,
                { color: theme.textMuted, marginBottom: 32 },
              ]}
            >
              {errorModalInfo?.message}
            </Text>
            <TouchableOpacity
              style={[
                styles.confirmBtn,
                {
                  backgroundColor:
                    errorModalInfo?.type === "OUT_OF_STOCK"
                      ? "#334155"
                      : theme.error,
                  width: "100%",
                },
              ]}
              onPress={() => setErrorModalInfo(null)}
            >
              <Text style={styles.acceptBtnText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 3. Details Modal */}
      <Modal
        animationType="slide"
        transparent
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
            <View style={styles.dragHandle} />
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.textMain }]}>
                Attendee Details
              </Text>
              <TouchableOpacity onPress={() => setSelectedAttendee(null)}>
                <View
                  style={[styles.closeBtn, { backgroundColor: theme.surface }]}
                >
                  <Feather name="x" size={20} color={theme.textMain} />
                </View>
              </TouchableOpacity>
            </View>

            {selectedAttendee && (
              <>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: selectedAttendee.foodClaimed
                        ? `${theme.success}15`
                        : `${theme.textMuted}15`,
                      borderColor: selectedAttendee.foodClaimed
                        ? theme.success
                        : theme.textMuted,
                    },
                  ]}
                >
                  <Feather
                    name={
                      selectedAttendee.foodClaimed ? "check-circle" : "clock"
                    }
                    size={16}
                    color={
                      selectedAttendee.foodClaimed
                        ? theme.success
                        : theme.textMuted
                    }
                  />
                  <Text
                    style={[
                      styles.statusBadgeText,
                      {
                        color: selectedAttendee.foodClaimed
                          ? theme.success
                          : theme.textMuted,
                      },
                    ]}
                  >
                    {selectedAttendee.foodClaimed
                      ? "ALREADY CLAIMED"
                      : "PENDING CLAIM"}
                  </Text>
                </View>
                <Text style={[styles.detailName, { color: theme.textMain }]}>
                  {selectedAttendee.name}
                </Text>
                <Text
                  style={[styles.traceText, { color: theme.textMuted }]}
                  numberOfLines={1}
                >
                  ID: {selectedAttendee.studentId}
                </Text>
                <Text
                  style={[
                    styles.traceText,
                    { color: theme.textMuted, marginBottom: 8 },
                  ]}
                  numberOfLines={1}
                >
                  {selectedAttendee.email}
                </Text>
                <Text
                  style={[styles.detailUniversity, { color: theme.textMuted }]}
                >
                  {selectedAttendee.university || "Unknown University"}
                </Text>

                <View style={styles.modalMetaRow}>
                  <View
                    style={[
                      styles.modalCategoryBadge,
                      { backgroundColor: `${theme.primary}15` },
                    ]}
                  >
                    <Text
                      style={[
                        styles.modalCategoryText,
                        { color: theme.primary },
                      ]}
                    >
                      {selectedAttendee.category || "Participant"}
                    </Text>
                  </View>
                  <Text
                    style={[styles.modalIdText, { color: theme.textMuted }]}
                  >
                    Token: #{selectedAttendee.id.substring(0, 10).toUpperCase()}
                  </Text>
                </View>

                <Text style={[styles.auditTitle, { color: theme.textMuted }]}>
                  AUDIT TRAIL
                </Text>
                <View style={styles.auditContainer}>
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
                        {formatDateTime(selectedAttendee.createdAt)}
                      </Text>
                      <Text
                        style={[styles.auditDesc, { color: theme.textMuted }]}
                      >
                        Registered in System
                      </Text>
                    </View>
                  </View>

                  {selectedAttendee.foodClaimed && (
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
                          {formatDateTime(selectedAttendee.claimedAt)}
                        </Text>
                        <Text
                          style={[styles.auditDesc, { color: theme.textMuted }]}
                        >
                          Scanned by{" "}
                          {selectedAttendee.scannerRole === "ADMIN"
                            ? "Admin"
                            : "Volunteer"}
                          :{" "}
                          <Text
                            style={{ color: theme.primary, fontWeight: "600" }}
                          >
                            {selectedAttendee.scannerName || "System"}
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
    </>
  );
}

const styles = StyleSheet.create({
  centerModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: SIZES.padding,
  },
  confirmModalCard: {
    width: "100%",
    padding: 24,
    borderRadius: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  warningIconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  confirmModalTitle: { ...FONTS.header, fontSize: 22, marginBottom: 8 },
  confirmModalText: {
    ...FONTS.body,
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  confirmModalActions: { flexDirection: "row", width: "100%", gap: 12 },
  confirmBtn: {
    flex: 1,
    height: 50,
    borderRadius: SIZES.radius,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelBtn: { borderWidth: 1 },
  cancelBtnText: { ...FONTS.body, fontWeight: "600", fontSize: 15 },
  acceptBtnText: {
    color: "#FFF",
    ...FONTS.body,
    fontWeight: "700",
    fontSize: 15,
  },
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
    minHeight: "55%",
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
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
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
  },
  detailName: { ...FONTS.header, fontSize: 28, marginBottom: 6 },
  traceText: { ...FONTS.body, fontSize: 13, fontWeight: "500", lineHeight: 17 },
  detailUniversity: {
    ...FONTS.body,
    fontSize: 16,
    marginBottom: 16,
    lineHeight: 22,
  },
  modalMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 32,
  },
  modalCategoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 12,
  },
  modalCategoryText: {
    ...FONTS.body,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  modalIdText: {
    ...FONTS.body,
    fontSize: 13,
    fontWeight: "600",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  auditTitle: {
    ...FONTS.muted,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 16,
  },
  auditContainer: { marginLeft: 8 },
  auditNode: { flexDirection: "row", marginBottom: 4 },
  auditTimeline: { alignItems: "center", width: 20, marginRight: 16 },
  auditDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  auditLine: { width: 2, flex: 1, marginVertical: 4 },
  auditDetails: { flex: 1, paddingBottom: 24 },
  auditTime: {
    ...FONTS.body,
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  auditDesc: { ...FONTS.body, fontSize: 14, lineHeight: 20 },
});
