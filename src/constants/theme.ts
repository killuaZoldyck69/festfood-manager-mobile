const brandColors = {
  primary: "#4F46E5",
  success: "#10B981",
  error: "#E11D48",
};

export const Colors = {
  light: {
    ...brandColors,
    background: "#F9FAFB",
    surface: "#FFFFFF",
    textMain: "#0F172A",
    textMuted: "#64748B",
    border: "#E2E8F0",
  },
} as const;

export type AppTheme = typeof Colors.light;

export type ThemeColor = keyof AppTheme;

export const SIZES = {
  radius: 12,
  padding: 16,
  touchTarget: 48,
} as const;

export const FONTS = {
  header: { fontSize: 28, fontWeight: "700" },
  body: { fontSize: 16 },
  muted: { fontSize: 14 },
} as const;
