import { FONTS, SIZES } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import * as SecureStore from "expo-secure-store";
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

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

// 🔴 UPDATED: Matched interface to the new backend grouping API
interface Volunteer {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  stats: {
    total: number;
    success: number;
    duplicate: number;
    invalid: number;
  };
}

export default function VolunteerList() {
  const theme = useTheme();
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);

  const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
    const token = await SecureStore.getItemAsync("better-auth.session_token");
    const headers: any = {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(Platform.OS !== "web" ? { Origin: BASE_URL || "" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };
    return fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
  };

  const fetchVolunteers = async () => {
    setIsLoading(true);
    try {
      const res = await fetchWithAuth("/api/admin/volunteers");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) setVolunteers(json.data);
    } catch {
      /* silent */
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchVolunteers();
    }, []),
  );

  const handleAddVolunteer = async () => {
    if (!form.name || !form.email || !form.password)
      return Alert.alert("Missing Fields", "Please fill out all fields.");
    setActionLoading("ADD_VOLUNTEER");
    try {
      const res = await fetchWithAuth("/api/admin/volunteers", {
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
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteVolunteer = (id: string, name: string) => {
    Alert.alert(
      "Remove Volunteer",
      `Are you sure you want to remove ${name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            setActionLoading(`DELETE_${id}`);
            try {
              const res = await fetchWithAuth(`/api/admin/volunteers/${id}`, {
                method: "DELETE",
              });
              if (res.ok)
                setVolunteers((prev) => prev.filter((v) => v.id !== id));
              else throw new Error("Failed to delete volunteer.");
            } catch (error: any) {
              Alert.alert("Error", error.message);
            } finally {
              setActionLoading(null);
            }
          },
        },
      ],
    );
  };

  const closeModal = () => {
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
            <View style={styles.volInfo}>
              <Text style={[styles.volName, { color: theme.textMain }]}>
                {vol.name}
              </Text>
              <Text style={[styles.volEmail, { color: theme.textMuted }]}>
                {vol.email}
              </Text>

              {/* 🔴 UPDATED: Detailed Stats Row */}
              <View style={styles.statsRow}>
                <View
                  style={[
                    styles.statBadge,
                    { backgroundColor: `${theme.success}15` },
                  ]}
                >
                  <Feather
                    name="check"
                    size={12}
                    color={theme.success}
                    style={{ marginRight: 4 }}
                  />
                  <Text style={[styles.statText, { color: theme.success }]}>
                    {vol.stats.success}
                  </Text>
                </View>

                <View
                  style={[styles.statBadge, { backgroundColor: "#FEF3C7" }]}
                >
                  <Feather
                    name="copy"
                    size={12}
                    color="#D97706"
                    style={{ marginRight: 4 }}
                  />
                  <Text style={[styles.statText, { color: "#D97706" }]}>
                    {vol.stats.duplicate}
                  </Text>
                </View>

                <View
                  style={[
                    styles.statBadge,
                    { backgroundColor: `${theme.error}15` },
                  ]}
                >
                  <Feather
                    name="x"
                    size={12}
                    color={theme.error}
                    style={{ marginRight: 4 }}
                  />
                  <Text style={[styles.statText, { color: theme.error }]}>
                    {vol.stats.invalid}
                  </Text>
                </View>

                <View
                  style={[
                    styles.statBadge,
                    {
                      backgroundColor: `${theme.textMuted}15`,
                      paddingHorizontal: 8,
                    },
                  ]}
                >
                  <Text style={[styles.statText, { color: theme.textMuted }]}>
                    Total:{" "}
                    <Text style={{ fontWeight: "800" }}>{vol.stats.total}</Text>
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => handleDeleteVolunteer(vol.id, vol.name)}
              disabled={actionLoading === `DELETE_${vol.id}`}
            >
              {actionLoading === `DELETE_${vol.id}` ? (
                <ActivityIndicator size="small" color={theme.error} />
              ) : (
                <Feather name="trash-2" size={20} color={theme.error} />
              )}
            </TouchableOpacity>
          </View>
        ))
      )}

      {/* MODAL */}
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
    flexDirection: "row",
    padding: 16,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    marginBottom: 12,
    alignItems: "center",
    justifyContent: "space-between",
  },
  volInfo: { flex: 1 },
  volName: { ...FONTS.body, fontWeight: "700", fontSize: 16, marginBottom: 4 },
  volEmail: { ...FONTS.muted, fontSize: 13, marginBottom: 12 },

  // 🔴 NEW STYLES for the stats row
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  statBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statText: {
    ...FONTS.body,
    fontSize: 11,
    fontWeight: "600",
  },

  deleteBtn: { padding: 8 },
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
});
