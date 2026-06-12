export const QUERY_KEYS = {
  inventory: ["inventory"] as const,

  attendees: (params: Record<string, string | undefined>) =>
    ["attendees", params] as const,
  attendeeFilters: ["attendeeFilters"] as const,

  logs: (params: Record<string, string | undefined>) =>
    ["logs", params] as const,
  logFilters: ["logFilters"] as const,
  volunteerLogs: (params: Record<string, string | undefined>) =>
    ["volunteerLogs", params] as const,

  volunteers: ["volunteers"] as const,
} as const;
