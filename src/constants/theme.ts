const brandColors = {
  primary: "#4F46E5", // Indigo
  success: "#10B981", // Emerald Green
  error: "#E11D48", // Rose Red
};

export const Colors = {
  light: {
    ...brandColors,
    background: "#F9FAFB", // Off-White
    surface: "#FFFFFF", // Pure White
    textMain: "#0F172A", // Slate Dark
    textMuted: "#64748B", // Slate Light
    border: "#E2E8F0", // Subtle border

    // --- Expo Boilerplate Fallbacks ---
    text: "#0F172A",
    tint: "#4F46E5",
    icon: "#64748B",
    tabIconDefault: "#64748B",
    tabIconSelected: "#4F46E5",
  },
};

export const SIZES = {
  radius: 12,
  padding: 16,
  touchTarget: 48,
};

export const FONTS = {
  header: { fontSize: 28, fontWeight: "700" as const },
  body: { fontSize: 16 },
  muted: { fontSize: 14 },
};
