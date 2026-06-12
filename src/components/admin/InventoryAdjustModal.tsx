import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import { Colors } from "../../constants/theme";

interface InventoryAdjustModalProps {
  visible: boolean;
  currentAvailable: number;
  onClose: () => void;
  onSubmit: (newAvailable: number) => Promise<void>;
}

export function InventoryAdjustModal({
  visible,
  currentAvailable,
  onClose,
  onSubmit,
}: InventoryAdjustModalProps): React.ReactElement {
  const [inputValue, setInputValue] = useState<string>(
    String(currentAvailable),
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (visible) {
      setInputValue(String(currentAvailable));
      setIsSubmitting(false);
    }
  }, [visible, currentAvailable]);

  const adjustValue = (amount: number) => {
    setInputValue((prev) => {
      const current = parseInt(prev, 10) || 0;
      const nextValue = Math.max(0, current + amount);
      return String(nextValue);
    });
  };

  const handleSubmit = async (): Promise<void> => {
    Keyboard.dismiss();

    const parsedValue = parseInt(inputValue, 10);
    if (isNaN(parsedValue) || parsedValue < 0) return;

    setIsSubmitting(true);
    try {
      await onSubmit(parsedValue);

      Toast.show({
        type: "success",
        text1: "Inventory Updated",
        text2: `Total available food set to ${parsedValue}.`,
        position: "bottom",
      });

      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.modalContent}>
          <Text style={styles.title}>Adjust Total Inventory</Text>
          <Text style={styles.description}>
            Update the total number of food items available for this event.
          </Text>

          <View style={styles.inputRow}>
            <TouchableOpacity
              style={styles.quickAdjustBtn}
              onPress={() => adjustValue(-10)}
              disabled={isSubmitting}
            >
              <Text style={styles.quickAdjustText}>-10</Text>
            </TouchableOpacity>

            {/* FIX: Wrapped TextInput in a flex: 1 container to constrain width */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={inputValue}
                onChangeText={setInputValue}
                keyboardType="number-pad"
                editable={!isSubmitting}
                selectTextOnFocus
                textAlign="center"
              />
            </View>

            <TouchableOpacity
              style={styles.quickAdjustBtn}
              onPress={() => adjustValue(10)}
              disabled={isSubmitting}
            >
              <Text style={styles.quickAdjustText}>+10</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={isSubmitting}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.submitButton]}
              onPress={handleSubmit}
              disabled={isSubmitting || inputValue.trim() === ""}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={Colors.light.surface} />
              ) : (
                <Text style={styles.submitButtonText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 24,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.light.textMain,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: Colors.light.textMuted,
    marginBottom: 20,
    lineHeight: 20,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
    width: "100%",
  },
  quickAdjustBtn: {
    backgroundColor: `${Colors.light.primary}15`,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  quickAdjustText: {
    color: Colors.light.primary,
    fontSize: 16,
    fontWeight: "800",
  },
  inputContainer: {
    flex: 1,
    marginHorizontal: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 22,
    fontWeight: "700",
    color: Colors.light.textMain,
    backgroundColor: Colors.light.background,
    width: "100%",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  cancelButtonText: {
    color: Colors.light.textMain,
    fontSize: 16,
    fontWeight: "600",
  },
  submitButton: {
    backgroundColor: Colors.light.primary,
  },
  submitButtonText: {
    color: Colors.light.surface,
    fontSize: 16,
    fontWeight: "600",
  },
});
