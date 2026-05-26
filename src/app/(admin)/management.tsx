import { FONTS, SIZES } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useFocusEffect } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useState } from "react";
import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";

// Import your newly created components!
import DangerZone from "@/components/admin/DangerZone";
import DataImportExport from "@/components/admin/DataImportExport";
import VolunteerList from "@/components/admin/VolunteerList";

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export default function AdminManagementScreen() {
  const theme = useTheme();

  // This state is shared: DataImport sets it to true, DangerZone sets it to false.
  const [hasAttendees, setHasAttendees] = useState(false);

  // Check the DB for attendees when the screen opens
  useFocusEffect(
    useCallback(() => {
      const checkAttendees = async () => {
        try {
          const token = await SecureStore.getItemAsync(
            "better-auth.session_token",
          );
          const headers: Record<string, string> = {
            Accept: "application/json",
          };
          if (token) headers.Authorization = `Bearer ${token}`;

          const res = await fetch(`${BASE_URL}/api/admin/attendees?limit=1`, {
            headers,
          });
          if (res.ok) {
            const data = await res.json();
            const count =
              data?.meta?.totalAttendees || data?.attendees?.length || 0;
            setHasAttendees(count > 0);
          } else {
            setHasAttendees(false);
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
