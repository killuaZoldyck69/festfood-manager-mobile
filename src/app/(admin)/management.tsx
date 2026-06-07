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

        <VolunteerList />

        <DangerZone onAttendeesWiped={() => setHasAttendees(false)} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    paddingTop: Platform.OS === "android" ? 40 : 24,
    paddingHorizontal: SIZES.padding,
    paddingBottom: 60,
  },
  header: { marginBottom: 24 },
  title: { ...FONTS.header, fontSize: 28, marginBottom: 8 },
  subtitle: { ...FONTS.body, lineHeight: 22 },
});
