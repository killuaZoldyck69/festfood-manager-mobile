import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import DangerZone from "../../components/admin/DangerZone";
import DataImportExport from "../../components/admin/DataImportExport";
import VolunteerList from "../../components/admin/VolunteerList";
import { FONTS, SIZES } from "../../constants/theme";
import { useTheme } from "../../hooks/use-theme";
import { apiClient } from "../../utils/apiClient";

export default function AdminManagementScreen(): React.ReactElement {
  const theme = useTheme();
  const [hasAttendees, setHasAttendees] = useState<boolean>(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useFocusEffect(
    useCallback(() => {
      const checkAttendees = async (): Promise<void> => {
        try {
          const res = await apiClient("/admin/attendees?limit=1");
          if (res.ok) {
            const data = await res.json();
            setHasAttendees(data.meta.total > 0);
          }
        } catch {
          setHasAttendees(false);
        }
      };
      checkAttendees();
    }, []),
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.primary }]}>
            Admin Center
          </Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>
            Import attendees, manage staff accounts, and control event
            logistics.
          </Text>
        </View>

        <DataImportExport
          hasAttendees={hasAttendees}
          onAttendeesUpdated={() => setHasAttendees(true)}
        />

        {/* Passing the key forces VolunteerList to re-mount/refresh when refreshKey changes */}
        <VolunteerList key={refreshKey} />

        <DangerZone
          onAttendeesWiped={() => setHasAttendees(false)}
          onVolunteersWiped={() => setRefreshKey((prev) => prev + 1)}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    paddingTop: Platform.OS === "android" ? 40 : 24,
    paddingHorizontal: SIZES.padding,
    paddingBottom: 40,
  },
  header: { marginBottom: 24 },
  title: { ...FONTS.header, fontSize: 28 },
  subtitle: { ...FONTS.body, fontSize: 14, marginTop: 4 },
});
