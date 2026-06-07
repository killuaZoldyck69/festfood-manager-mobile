export interface PaginatedMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginatedMeta;
}

export interface AttendeeListItem {
  id: string;
  name: string;
  email: string;
  studentId: string;
  university: string;
  role: string;
  category: string;
  semester: string;
  section: string;
  qrToken: string;
  foodClaimed: boolean;
  claimedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AttendeeFilterOptions {
  search?: string;
  category?: string;
  foodClaimed?: boolean;
}

export interface FormattedLog {
  id: string;
  status: string;
  scannedToken: string;
  scannedAt: string;
  volunteerName: string | null;
  attendeeName: string | null;
}

export interface LogFilterOptions {
  status?: string;
  search?: string;
  volunteerId?: string;
}

export interface InventoryStats {
  totalAvailable: number;
  totalServed: number;
  totalParticipants: number;
  duplicateScans: number;
  invalidTickets: number;
  percentageClaimed: number;
}

export interface VolunteerListItem {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  totalScans: number;
}

export type ScanStatus =
  | "IDLE"
  | "PROCESSING"
  | "SUCCESS"
  | "INVALID"
  | "DUPLICATE"
  | "DEPLETED"
  | "ERROR";

export interface ScanResult {
  status: ScanStatus;
  message?: string;
  attendeeName?: string;
}
