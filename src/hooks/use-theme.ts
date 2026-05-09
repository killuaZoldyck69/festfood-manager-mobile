import { Colors } from "@/constants/theme";

export function useTheme() {
  // We simply return the light theme directly.
  // No more listening for system preferences!
  return Colors.light;
}
