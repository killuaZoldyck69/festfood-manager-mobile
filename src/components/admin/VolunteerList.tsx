import { Feather } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import { QUERY_KEYS } from "../../constants/queryKeys";
import { FONTS, SIZES } from "../../constants/theme";
import { useTheme } from "../../hooks/use-theme";
import { VolunteerListItem } from "../../types";
import { apiClient } from "../../utils/apiClient";
import { EmptyState } from "../ui/EmptyState";
import AddVolunteerModal from "./AddVolunteerModal";
import DeleteVolunteerModal from "./DeleteVolunteerModal";

export default function VolunteerList(): React.ReactElement {
  const theme = useTheme();
  const queryClient = useQueryClient();

  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [deleteModal, setDeleteModal] = useState<{
    visible: boolean;
    id: string;
    name: string;
  }>({
    visible: false,
    id: "",
    name: "",
  });

  const {
    data: volunteers = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: QUERY_KEYS.volunteers,
    queryFn: async () => {
      const res = await apiClient("/admin/volunteers");
      if (!res.ok) throw new Error("Failed to fetch volunteers");
      const json = await res.json();
      return json.data as VolunteerListItem[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (newVolunteer: any) => {
      const res = await apiClient("/admin/volunteers", {
        method: "POST",
        body: JSON.stringify(newVolunteer),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to add volunteer.");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.volunteers });
      setModalVisible(false);
      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Volunteer account created.",
        position: "bottom",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient(`/admin/volunteers/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete volunteer.");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.volunteers });
      setDeleteModal({ visible: false, id: "", name: "" });
      Toast.show({
        type: "success",
        text1: "Removed",
        text2: "Volunteer access revoked.",
        position: "bottom",
      });
    },
  });

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
          style={{ marginVertical: 40 }}
        />
      ) : error ? (
        <EmptyState icon="alert-octagon" message={error.message} />
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
                disabled={
                  deleteMutation.isPending &&
                  deleteMutation.variables === vol.id
                }
              >
                {deleteMutation.isPending &&
                deleteMutation.variables === vol.id ? (
                  <ActivityIndicator size="small" color={theme.error} />
                ) : (
                  <Feather name="trash-2" size={16} color={theme.error} />
                )}
              </TouchableOpacity>
            </View>

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

      <AddVolunteerModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={(data) => addMutation.mutate(data)}
        isPending={addMutation.isPending}
      />

      <DeleteVolunteerModal
        visible={deleteModal.visible}
        volunteerName={deleteModal.name}
        onClose={() =>
          !deleteMutation.isPending &&
          setDeleteModal({ ...deleteModal, visible: false })
        }
        onConfirm={() => deleteMutation.mutate(deleteModal.id)}
        isPending={deleteMutation.isPending}
      />
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
  emptyCard: {
    padding: 20,
    borderRadius: SIZES.radius,
    alignItems: "center",
    marginBottom: 24,
  },
  volunteerCard: {
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
  statBox: { alignItems: "center", flex: 1 },
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
});
