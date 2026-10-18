// Data-access contracts for the client admin app. Pages depend only on these
// types; the active adapter (sample or Convex) is chosen in services/index.ts.
// Field names follow the Convex schema (backend `convex/schema.ts`).

export type DataSourceKind = "sample" | "convex";

export type EmployeeStatus = "ACTIVE" | "PENDING_FACE_REGISTRATION" | "TERMINATED";
export type FaceRegistrationStatus = "REGISTERED" | "NOT_REGISTERED";
export type AttendanceStatus = "PRESENT" | "LATE" | "HALF_DAY" | "ABSENT" | "OVERTIME";

export interface Department {
  departmentId: string;
  name: string;
}

export interface Employee {
  employeeId: string;
  name: string;
  email: string;
  phone?: string;
  departmentId: string;
  departmentName: string;
  designation: string;
  status: EmployeeStatus;
  faceId?: string;
  faceEncodingId?: number;
  faceRegisteredAt?: string;
  biometricConsentGiven: boolean;
  lastPunchAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeInput {
  employeeId: string;
  name: string;
  email: string;
  phone?: string;
  departmentId: string;
  designation: string;
}

export interface EmployeeUpdate {
  name?: string;
  email?: string;
  phone?: string;
  departmentId?: string;
  designation?: string;
  status?: EmployeeStatus;
}

export interface EmployeeQuery {
  search?: string;
  departmentId?: string;
  status?: EmployeeStatus;
  faceStatus?: FaceRegistrationStatus;
  page: number;
  pageSize: number;
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AttendanceRecord {
  attendanceId: string;
  employeeId: string;
  employeeName: string;
  departmentName: string;
  attendanceDate: string; // YYYY-MM-DD
  checkInTime?: string; // HH:mm:ss
  checkOutTime?: string;
  activeMinutes?: number;
  status: AttendanceStatus;
  locationVerified?: boolean;
  locationName?: string;
  requestId: string;
}

export interface DashboardFilters {
  date: string; // YYYY-MM-DD
  departmentId?: string;
}

export interface DashboardSummary {
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  checkedInNow: number;
  missingCheckOuts: number;
  /** 0–100, present (incl. late) over active employees. */
  attendanceRate: number;
}

export interface DailyAttendancePoint {
  date: string;
  present: number;
  late: number;
  absent: number;
}

export interface MonthlyAttendancePoint {
  month: string; // YYYY-MM
  attendanceRate: number;
}

export interface DashboardData {
  summary: DashboardSummary;
  daily: DailyAttendancePoint[];
  monthly: MonthlyAttendancePoint[];
  recentActivity: AttendanceRecord[];
}

export interface FaceRegistrationInput {
  employeeId: string;
  /** JPEG data URL prepared in the browser (see lib/image.ts). */
  imageDataUrl: string;
  /** Must be explicitly true; the backend refuses registration without it. */
  consentConfirmed: true;
  /** Same key for retries of the same photo, so a timed-out request that succeeded is not enrolled twice. */
  idempotencyKey: string;
}

export interface FaceRegistrationResult {
  employeeId: string;
  faceId: string;
  faceEncodingId?: number;
  facesDetected?: number;
  registeredAt: string;
  requestId?: string;
}

export interface FaceVerificationInput {
  /** 1:1 check: the match must be this employee. */
  employeeId: string;
  imageDataUrl: string;
}

export interface FaceVerificationResult {
  verified: boolean;
  message: string;
  matchScore?: number;
  distance?: number;
  /** Set when the face matched a different employee. */
  recognizedEmployeeId?: string;
  requestId?: string;
}

export type ServiceErrorCode =
  | "NOT_FOUND"
  | "CONFLICT"
  | "VALIDATION"
  | "FORBIDDEN"
  | "NOT_CONFIGURED"
  | "UNAVAILABLE"
  | "UNKNOWN";

/** Thrown by adapters; `code` lets the UI pick an appropriate message. */
export class ServiceError extends Error {
  constructor(
    message: string,
    public readonly code: ServiceErrorCode = "UNKNOWN",
    /** Backend request ID, when there is one, for support lookups. */
    public readonly requestId?: string,
  ) {
    super(message);
    this.name = "ServiceError";
  }
}

export interface DataService {
  readonly kind: DataSourceKind;
  listDepartments(): Promise<Department[]>;
  getDashboard(filters: DashboardFilters): Promise<DashboardData>;
  listEmployees(query: EmployeeQuery): Promise<Page<Employee>>;
  getEmployee(employeeId: string): Promise<Employee>;
  createEmployee(input: EmployeeInput): Promise<Employee>;
  updateEmployee(employeeId: string, update: EmployeeUpdate): Promise<Employee>;
  listEmployeeAttendance(employeeId: string, limit: number): Promise<AttendanceRecord[]>;
  registerFace(input: FaceRegistrationInput): Promise<FaceRegistrationResult>;
  verifyFace(input: FaceVerificationInput): Promise<FaceVerificationResult>;
}
