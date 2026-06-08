import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { FONTS, SIZES } from "../../constants/theme";
import { useTheme } from "../../hooks/use-theme";
import { VolunteerListItem } from "../../types";
import { apiClient } from "../../utils/apiClient";
import { EmptyState } from "../ui/EmptyState";

export default function VolunteerList(): React.ReactElement {
  const theme = useTheme();
  const [volunteers, setVolunteers] = useState<VolunteerListItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [errorState, setErrorState] = useState<string | null>(null);

  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const [deleteModal, setDeleteModal] = useState<{
    visible: boolean;
    id: string;
    name: string;
  }>({ visible: false, id: "", name: "" });

  const fetchVolunteers = async (): Promise<void> => {
    setIsLoading(true);
    setErrorState(null);
    try {
      const res = await apiClient("/admin/volunteers");
      const json = await res.json();
      if (res.ok && Array.isArray(json.data)) {
        setVolunteers(json.data);
      } else {
        throw new Error("Failed to fetch volunteers");
      }
    } catch (err) {
      setErrorState(err instanceof Error ? err.message : "Network Error");
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchVolunteers();
    }, []),
  );

  const handleAddVolunteer = async (): Promise<void> => {
    if (!form.name || !form.email || !form.password) {
      Alert.alert("Missing Fields", "Please fill out all fields.");
      return;
    }
    setActionLoading("ADD_VOLUNTEER");
    try {
      const res = await apiClient("/admin/volunteers", {
        method: "POST",
        body: JSON.stringify(form),
      });
      if (res.ok) {
        closeModal();
        fetchVolunteers();
      } else {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to add volunteer.");
      }
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Unknown error",
      );
    } finally {
      setActionLoading(null);
    }
  };

  const confirmDelete = async (): Promise<void> => {
    if (!deleteModal.id) return;
    setActionLoading(`DELETE_${deleteModal.id}`);

    try {
      const res = await apiClient(`/admin/volunteers/${deleteModal.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setVolunteers((prev) => prev.filter((v) => v.id !== deleteModal.id));
        setDeleteModal({ visible: false, id: "", name: "" });
      } else {
        throw new Error("Failed to delete volunteer.");
      }
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Unknown error",
      );
    } finally {
      setActionLoading(null);
    }
  };

  const closeModal = (): void => {
    setModalVisible(false);
    setForm({ name: "", email: "", password: "" });
    setShowPassword(false);
  };

  return (
    <View>
      <View style={[styles.sectionHeader, { marginTop: 24 }]}>
        <Text style={[styles.sectionTitle, { color: theme.textMain }]}>
          Volunteers
        </Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.primary }]}
          onPress={() => setModalVisible(true)}
        >
          <Feather name="plus" size={16} color="#FFF" />
          <Text style={styles.addButtonText}>Add New</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator
          size="large"
          color={theme.primary}
          style={styles.loader}
        />
      ) : errorState ? (
        <EmptyState icon="alert-octagon" message={errorState} />
      ) : volunteers.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: theme.surface }]}>
          <Text style={{ color: theme.textMuted, ...FONTS.body }}>
            No volunteers found.
          </Text>
        </View>
      ) : (
        volunteers.map((vol) => (
          <View
            key={vol.id}
            style={[
              styles.volunteerCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            {/* Top Row: User Info & Actions */}
            <View style={styles.cardHeaderRow}>
              <View style={styles.volInfo}>
                <Text style={[styles.volName, { color: theme.textMain }]}>
                  {vol.name}
                </Text>
                <Text style={[styles.volEmail, { color: theme.textMuted }]}>
                  {vol.email}
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.deleteBtn,
                  { backgroundColor: `${theme.error}10` },
                ]}
                onPress={() =>
                  setDeleteModal({ visible: true, id: vol.id, name: vol.name })
                }
                disabled={actionLoading === `DELETE_${vol.id}`}
              >
                {actionLoading === `DELETE_${vol.id}` ? (
                  <ActivityIndicator size="small" color={theme.error} />
                ) : (
                  <Feather name="trash-2" size={16} color={theme.error} />
                )}
              </TouchableOpacity>
            </View>

            {/* Bottom Row: Detailed Statistics Grid */}
            <View style={[styles.statsGrid, { borderTopColor: theme.border }]}>
              <View style={styles.statBox}>
                <Feather name="layers" size={14} color={theme.textMuted} />
                <Text style={[styles.statValue, { color: theme.textMain }]}>
                  {(vol as any).totalScans || 0}
                </Text>
                <Text style={[styles.statLabel, { color: theme.textMuted }]}>
                  Total
                </Text>
              </View>

              <View style={styles.statBox}>
                <Feather name="check-circle" size={14} color={theme.success} />
                <Text style={[styles.statValue, { color: theme.textMain }]}>
                  {(vol as any).successScans || 0}
                </Text>
                <Text style={[styles.statLabel, { color: theme.textMuted }]}>
                  Success
                </Text>
              </View>

              <View style={styles.statBox}>
                <Feather name="copy" size={14} color={theme.error} />
                <Text style={[styles.statValue, { color: theme.textMain }]}>
                  {(vol as any).duplicateScans || 0}
                </Text>
                <Text style={[styles.statLabel, { color: theme.textMuted }]}>
                  Dupe
                </Text>
              </View>

              <View style={styles.statBox}>
                <Feather name="alert-triangle" size={14} color="#F59E0B" />
                <Text style={[styles.statValue, { color: theme.textMain }]}>
                  {(vol as any).invalidScans || 0}
                </Text>
                <Text style={[styles.statLabel, { color: theme.textMuted }]}>
                  Invalid
                </Text>
              </View>
            </View>
          </View>
        ))
      )}

      {/* --- ADD VOLUNTEER MODAL --- */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContent, { backgroundColor: theme.background }]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.textMain }]}>
                Add Volunteer
              </Text>
              <TouchableOpacity onPress={closeModal}>
                <Feather name="x" size={24} color={theme.textMain} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.surface,
                  color: theme.textMain,
                  borderColor: theme.border,
                },
              ]}
              placeholder="Full Name"
              placeholderTextColor={theme.textMuted}
              value={form.name}
              onChangeText={(txt) => setForm({ ...form, name: txt })}
            />
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.surface,
                  color: theme.textMain,
                  borderColor: theme.border,
                },
              ]}
              placeholder="Email Address"
              placeholderTextColor={theme.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              value={form.email}
              onChangeText={(txt) => setForm({ ...form, email: txt })}
            />

            <View
              style={[
                styles.passwordContainer,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
            >
              <TextInput
                style={[styles.passwordInput, { color: theme.textMain }]}
                placeholder="Password"
                placeholderTextColor={theme.textMuted}
                secureTextEntry={!showPassword}
                value={form.password}
                onChangeText={(txt) => setForm({ ...form, password: txt })}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Feather
                  name={showPassword ? "eye" : "eye-off"}
                  size={20}
                  color={theme.textMuted}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: theme.primary }]}
              onPress={handleAddVolunteer}
              disabled={actionLoading === "ADD_VOLUNTEER"}
            >
              {actionLoading === "ADD_VOLUNTEER" ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.submitButtonText}>Create Account</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* --- DELETE CONFIRMATION MODAL --- */}
      <Modal
        animationType="fade"
        transparent
        visible={deleteModal.visible}
        onRequestClose={() => {
          if (!actionLoading)
            setDeleteModal({ ...deleteModal, visible: false });
        }}
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
                { backgroundColor: `${theme.error}15` },
              ]}
            >
              <Feather name="user-x" size={32} color={theme.error} />
            </View>

            <Text
              style={[
                styles.confirmModalTitle,
                { color: theme.textMain, textAlign: "center" },
              ]}
            >
              Remove Volunteer?
            </Text>

            <Text style={[styles.confirmModalText, { color: theme.textMuted }]}>
              Are you sure you want to revoke access for{" "}
              <Text style={{ fontWeight: "700", color: theme.textMain }}>
                {deleteModal.name}
              </Text>
              ? Their past scan records will remain, but they will no longer be
              able to log in.
            </Text>

            <View style={styles.confirmModalActions}>
              <TouchableOpacity
                style={[
                  styles.confirmBtn,
                  styles.cancelBtn,
                  { borderColor: theme.border },
                ]}
                onPress={() =>
                  setDeleteModal({ ...deleteModal, visible: false })
                }
                disabled={!!actionLoading}
              >
                <Text style={[styles.cancelBtnText, { color: theme.textMain }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirmBtn, { backgroundColor: theme.error }]}
                onPress={confirmDelete}
                disabled={!!actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.acceptBtnText}>Remove</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: { ...FONTS.header, fontSize: 20 },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: "#FFF",
    ...FONTS.body,
    fontWeight: "700",
    marginLeft: 6,
    fontSize: 13,
  },
  loader: { marginTop: 40, marginBottom: 40 },
  emptyCard: {
    padding: 20,
    borderRadius: SIZES.radius,
    alignItems: "center",
    marginBottom: 24,
  },
  volunteerCard: {
    flexDirection: "column",
    padding: 16,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  volInfo: { flex: 1, paddingRight: 10 },
  volName: { ...FONTS.body, fontWeight: "700", fontSize: 16, marginBottom: 2 },
  volEmail: { ...FONTS.muted, fontSize: 13 },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 16,
    borderTopWidth: 1,
  },
  statBox: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    ...FONTS.body,
    fontSize: 15,
    fontWeight: "800",
    marginTop: 6,
    marginBottom: 2,
  },
  statLabel: {
    ...FONTS.body,
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: SIZES.padding,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
    minHeight: "50%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    marginTop: 8,
  },
  modalTitle: { ...FONTS.header, fontSize: 22 },
  input: {
    ...FONTS.body,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 16,
  },
  passwordInput: {
    flex: 1,
    ...FONTS.body,
    padding: 16,
    fontSize: 16,
  },
  eyeIcon: {
    padding: 16,
  },
  submitButton: {
    height: 56,
    borderRadius: SIZES.radius,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  submitButtonText: {
    color: "#FFF",
    ...FONTS.body,
    fontWeight: "700",
    fontSize: 16,
  },

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
});
