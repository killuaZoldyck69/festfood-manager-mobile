import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Colors } from "../../constants/theme";
import { PaginatedMeta } from "../../types";

interface PaginationFooterProps {
  meta: PaginatedMeta;
  isLoading: boolean;
  onPrev: () => void;
  onNext: () => void;
}

export function PaginationFooter({
  meta,
  isLoading,
  onPrev,
  onNext,
}: PaginationFooterProps): React.ReactElement {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.button,
          (meta.page <= 1 || isLoading) && styles.disabled,
        ]}
        disabled={meta.page <= 1 || isLoading}
        onPress={onPrev}
      >
        <Text style={styles.buttonText}>Prev</Text>
      </TouchableOpacity>

      <View style={styles.infoContainer}>
        {isLoading ? (
          <ActivityIndicator size="small" color={Colors.light.primary} />
        ) : (
          <Text style={styles.infoText}>
            Page {meta.page} of {meta.totalPages || 1}
          </Text>
        )}
      </View>

      <TouchableOpacity
        style={[styles.button, (!meta.hasMore || isLoading) && styles.disabled]}
        disabled={!meta.hasMore || isLoading}
        onPress={onNext}
      >
        <Text style={styles.buttonText}>Next</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: Colors.light.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: Colors.light.border,
    borderRadius: 8,
  },
  disabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.textMain,
  },
  infoContainer: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 80,
  },
  infoText: {
    fontSize: 14,
    color: Colors.light.textMuted,
  },
});
