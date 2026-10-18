// Types for the Client Admin Portal (Tenant-Scoped)

export type ClientAdminRole = "PRIMARY_MASTER_ADMIN" | "HR_ADMIN" | "DEPARTMENT_MANAGER";

export interface ClientUser {
  userId: string;
  clientId: string;
  name: string;
  email: string;
  role: ClientAdminRole;
  departmentId?: string;
  status: "ACTIVE" | "INACTIVE";
  permissions: string[];
  createdAt: string;
}

export interface ClientDepartment {
  departmentId: string;
  clientId: string;
  name: string;
  managerName?: string;
  headcount: number;
  createdAt: string;
}

export interface ClientShift {
  shiftId: string;
  clientId: string;
  name: string;
  startTime: string; // e.g. "09:00"
  endTime: string; // e.g. "18:00"
  gracePeriodMinutes: number; // 15
  halfDayThresholdMinutes: number; // 240
  assignedEmployeesCount: number;
  status: "ACTIVE" | "INACTIVE";
}

export interface ClientEmployee {
  employeeId: string;
  clientId: string;
  masterId: string;
  name: string;
  email: string;
  phone?: string;
  departmentId: string;
  departmentName: string;
  designation: string;
  shiftId?: string;
  faceId?: string; // Opaque reference to R2 vector (e.g. "FACE_abc_98124")
  faceRegisteredAt?: string;
  faceQualityScore?: number;
  status: "ACTIVE" | "PENDING_FACE_REGISTRATION" | "TERMINATED";
  lastPunchAt?: string;
  createdAt: string;
}

export interface ClientAttendanceCorrection {
  correctedBy: string;
  correctedAt: string;
  reason: string;
  previousCheckIn?: string;
  previousCheckOut?: string;
}

export interface ClientAttendanceRecord {
  attendanceId: string;
  clientId: string;
  employeeId: string;
  employeeName: string;
  departmentName: string;
  attendanceDate: string; // "YYYY-MM-DD"
  checkInTime: string; // "09:02:14"
  checkOutTime?: string; // "18:05:22"
  activeMinutes?: number;
  status: "PRESENT" | "LATE" | "HALF_DAY" | "ABSENT" | "OVERTIME";
  isLate: boolean;
  locationVerified: boolean;
  locationName?: string;
  distanceMeters?: number;
  verificationScore?: number;
  requestId: string;
  correctionLog?: ClientAttendanceCorrection;
}

export interface ClientLocation {
  locationId: string;
  clientId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  allowedRadiusMeters: number;
  status: "ACTIVE" | "INACTIVE";
}

export interface ClientSettings {
  clientId: string;
  companyName: string;
  companyLogo?: string;
  officeStartTime: string;
  officeEndTime: string;
  lateThresholdMinutes: number;
  timezone: string;
  geofenceStrictEnforced: boolean;
  autoCheckoutAtMidnight: boolean;
  biometricRetentionDays: number;
}

export interface ClientNotification {
  notificationId: string;
  clientId: string;
  title: string;
  message: string;
  category: "ATTENDANCE" | "BIOMETRIC" | "SECURITY" | "SYSTEM";
  severity: "INFO" | "WARNING" | "CRITICAL";
  isRead: boolean;
  createdAt: string;
}

export interface ClientAuditLog {
  auditId: string;
  requestId: string;
  clientId: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  targetResource: string;
  outcome: "SUCCESS" | "DENIED" | "FAILED";
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface ClientApiUsage {
  requestId: string;
  clientId: string;
  employeeId?: string;
  endpoint: string;
  environment: "DEV" | "UAT" | "PROD";
  status: "SUCCESS" | "FAILED";
  responseTimeMs: number;
  tokensConsumed: number;
  timestamp: string;
}
