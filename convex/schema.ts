// Convex Database Schema — Complete Enterprise Multi-Tenant Biometric SaaS Platform
// Tenant-Isolated Tables with Compound Indexes

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // 1. Platform Super Administrators
  superAdmins: defineTable({
    adminId: v.string(),
    name: v.string(),
    email: v.string(),
    status: v.union(v.literal("ACTIVE"), v.literal("DISABLED")),
    createdAt: v.number(),
  }).index("by_email", ["email"]),

  // 2. Corporate Tenant Clients
  clients: defineTable({
    clientId: v.string(), // e.g. "ABC001"
    companyName: v.string(),
    companyLogo: v.optional(v.string()),
    contactEmail: v.string(),
    contactPhone: v.optional(v.string()),
    status: v.union(v.literal("ACTIVE"), v.literal("SUSPENDED"), v.literal("TRIAL"), v.literal("ARCHIVED")),
    subscriptionPlan: v.union(v.literal("STARTER"), v.literal("PROFESSIONAL"), v.literal("ENTERPRISE"), v.literal("CUSTOM")),
    timeZone: v.string(),
    allowedEnvironments: v.array(v.union(v.literal("DEV"), v.literal("UAT"), v.literal("PROD"))),
    faceApiKeyEncrypted: v.optional(v.string()), // Encrypted tenant-specific Railway Face API key
    faceApiRegion: v.optional(v.string()), // e.g. "ka"
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_client_id", ["clientId"])
    .index("by_status", ["status"]),

  // 3. Master Administrators (Tenant Owners)
  masterAdmins: defineTable({
    masterId: v.string(), // e.g. "MASTER001"
    clientId: v.string(),
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    passwordHash: v.optional(v.string()),
    role: v.union(v.literal("PRIMARY_MASTER_ADMIN"), v.literal("REGIONAL_ADMIN"), v.literal("HR_OPERATIONS")),
    status: v.union(v.literal("ACTIVE"), v.literal("INVITED"), v.literal("DISABLED")),
    twoFactorEnabled: v.boolean(),
    lastLoginAt: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_master_id", ["masterId"])
    .index("by_client", ["clientId"])
    .index("by_email", ["email"]),

  // 4. Client Users & Roles (HR, Managers, Admins)
  clientUsers: defineTable({
    userId: v.string(),
    clientId: v.string(),
    name: v.string(),
    email: v.string(),
    role: v.union(v.literal("MASTER_ADMIN"), v.literal("HR_ADMIN"), v.literal("DEPARTMENT_MANAGER")),
    departmentId: v.optional(v.string()),
    status: v.union(v.literal("ACTIVE"), v.literal("INACTIVE")),
    permissions: v.array(v.string()),
    createdAt: v.number(),
  })
    .index("by_client", ["clientId"])
    .index("by_client_and_email", ["clientId", "email"])
    .index("by_email", ["email"]),

  // 5. Employees Directory
  employees: defineTable({
    employeeId: v.string(), // e.g. "EMP0098" or "EMP-1001"
    clientId: v.string(),
    masterId: v.string(),
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    departmentId: v.string(),
    departmentName: v.string(),
    designation: v.string(),
    empRank: v.optional(v.string()), // Passed to Face API /api/enroll
    shiftId: v.optional(v.string()),
    faceId: v.optional(v.string()), // Opaque reference to face encoding
    faceEncodingId: v.optional(v.number()), // Numerical ID returned by Face API
    faceRegisteredAt: v.optional(v.string()),
    faceQualityScore: v.optional(v.number()),
    biometricConsentGiven: v.boolean(),
    biometricConsentDate: v.optional(v.string()),
    status: v.union(v.literal("ACTIVE"), v.literal("PENDING_FACE_REGISTRATION"), v.literal("TERMINATED")),
    lastPunchAt: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_client", ["clientId"])
    .index("by_client_and_emp_id", ["clientId", "employeeId"])
    .index("by_client_and_dept", ["clientId", "departmentId"])
    .index("by_client_and_status", ["clientId", "status"]),

  // 6. Departments
  departments: defineTable({
    departmentId: v.string(),
    clientId: v.string(),
    name: v.string(),
    managerName: v.optional(v.string()),
    headcount: v.number(),
    createdAt: v.number(),
  })
    .index("by_client", ["clientId"])
    .index("by_client_and_name", ["clientId", "name"]),

  // 7. Shifts & Schedules
  shifts: defineTable({
    shiftId: v.string(),
    clientId: v.string(),
    name: v.string(),
    startTime: v.string(), // "09:00"
    endTime: v.string(), // "18:00"
    gracePeriodMinutes: v.number(), // 15
    halfDayThresholdMinutes: v.number(), // 240
    assignedEmployeesCount: v.number(),
    status: v.union(v.literal("ACTIVE"), v.literal("INACTIVE")),
    createdAt: v.number(),
  })
    .index("by_client", ["clientId"])
    .index("by_client_and_status", ["clientId", "status"]),

  // 8. Attendance Records
  attendance: defineTable({
    attendanceId: v.string(),
    clientId: v.string(),
    employeeId: v.string(),
    employeeName: v.string(),
    departmentName: v.string(),
    attendanceDate: v.string(), // "YYYY-MM-DD"
    checkInTime: v.string(),
    checkOutTime: v.optional(v.string()),
    activeMinutes: v.optional(v.number()),
    status: v.union(v.literal("PRESENT"), v.literal("LATE"), v.literal("HALF_DAY"), v.literal("ABSENT"), v.literal("OVERTIME")),
    isLate: v.boolean(),
    locationVerified: v.boolean(),
    locationName: v.optional(v.string()),
    distanceMeters: v.optional(v.number()),
    verificationScore: v.optional(v.number()),
    faceDistance: v.optional(v.number()),
    requestId: v.string(),
    idempotencyKey: v.optional(v.string()),
    correctionLog: v.optional(
      v.object({
        correctedBy: v.string(),
        correctedAt: v.string(),
        reason: v.string(),
        previousCheckIn: v.optional(v.string()),
        previousCheckOut: v.optional(v.string()),
        previousStatus: v.optional(v.string()),
      })
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_client", ["clientId"])
    .index("by_client_and_date", ["clientId", "attendanceDate"])
    .index("by_client_and_employee", ["clientId", "employeeId"])
    .index("by_client_emp_date", ["clientId", "employeeId", "attendanceDate"])
    .index("by_request_id", ["requestId"]),

  // 9. Approved Attendance Locations & Geofences
  locations: defineTable({
    locationId: v.string(),
    clientId: v.string(),
    name: v.string(),
    address: v.string(),
    latitude: v.number(),
    longitude: v.number(),
    allowedRadiusMeters: v.number(),
    status: v.union(v.literal("ACTIVE"), v.literal("INACTIVE")),
    createdAt: v.number(),
  })
    .index("by_client", ["clientId"])
    .index("by_client_and_status", ["clientId", "status"]),

  // 10. Attendance Policies
  attendancePolicies: defineTable({
    policyId: v.string(),
    clientId: v.string(),
    minWorkingHoursStandard: v.number(), // default 8
    halfDayHours: v.number(), // default 4
    overtimeThresholdMinutes: v.number(), // default 540 (9 hours)
    requireGeofence: v.boolean(),
    allowManualCorrection: v.boolean(),
    maxLateAllowedPerMonth: v.number(),
    updatedAt: v.number(),
  }).index("by_client", ["clientId"]),

  // 11. Client Settings
  clientSettings: defineTable({
    clientId: v.string(),
    officeStartTime: v.string(),
    officeEndTime: v.string(),
    lateThresholdMinutes: v.number(),
    timezone: v.string(),
    geofenceStrictEnforced: v.boolean(),
    autoCheckoutAtMidnight: v.boolean(),
    biometricRetentionDays: v.number(),
    minMatchScore: v.number(), // e.g. 85.0
    maxMatchDistance: v.number(), // e.g. 0.35
  }).index("by_client", ["clientId"]),

  // 12. Modular Feature Flags
  feature_flags: defineTable({
    clientId: v.string(),
    faceRegistration: v.boolean(),
    faceVerification: v.boolean(),
    attendance: v.boolean(),
    gpsValidation: v.boolean(),
    reports: v.boolean(),
    notifications: v.boolean(),
    payrollExport: v.boolean(),
    strictLiveness: v.boolean(),
    apiAccess: v.boolean(),
  }).index("by_client", ["clientId"]),

  // 13. Face Registration Ledger
  faceRegistrations: defineTable({
    registrationId: v.string(),
    clientId: v.string(),
    employeeId: v.string(),
    faceEncodingId: v.number(),
    facesDetected: v.number(),
    processingTime: v.number(),
    vectorStorageRef: v.optional(v.string()), // Opaque R2 key pointer
    registeredBy: v.string(),
    status: v.union(v.literal("ACTIVE"), v.literal("REVOKED"), v.literal("SUPERSEDED")),
    requestId: v.string(),
    createdAt: v.number(),
  })
    .index("by_client", ["clientId"])
    .index("by_client_and_employee", ["clientId", "employeeId"])
    .index("by_face_encoding", ["faceEncodingId"]),

  // 14. API Tokens (UAT & Production Keys with Quotas)
  api_tokens: defineTable({
    tokenId: v.string(),
    clientId: v.string(),
    masterId: v.optional(v.string()),
    name: v.string(),
    tokenHash: v.string(), // SHA-256 hash of plaintext key
    tokenMasked: v.string(), // e.g. "uat_a89f**********d90a"
    environment: v.union(v.literal("DEV"), v.literal("UAT"), v.literal("PROD")),
    allocatedTokens: v.number(),
    usedTokens: v.number(),
    remainingTokens: v.number(),
    status: v.union(v.literal("ACTIVE"), v.literal("REVOKED"), v.literal("EXPIRED")),
    expiresAt: v.optional(v.number()),
    createdAt: v.number(),
    lastUsedAt: v.optional(v.number()),
  })
    .index("by_token_hash", ["tokenHash"])
    .index("by_client", ["clientId"])
    .index("by_client_and_env", ["clientId", "environment"]),

  // 15. API Usage Telemetry (Tenant Scoped)
  api_usage: defineTable({
    requestId: v.string(),
    clientId: v.string(),
    masterAdminId: v.optional(v.string()),
    employeeId: v.optional(v.string()),
    endpoint: v.string(),
    operation: v.string(),
    environment: v.union(v.literal("DEV"), v.literal("UAT"), v.literal("PROD")),
    status: v.union(v.literal("SUCCESS"), v.literal("FAILED"), v.literal("DENIED")),
    httpStatus: v.number(),
    responseTimeMs: v.number(),
    tokensConsumed: v.number(),
    tokenRef: v.optional(v.string()),
    timestamp: v.string(),
    createdAt: v.number(),
  })
    .index("by_client", ["clientId"])
    .index("by_request_id", ["requestId"])
    .index("by_client_and_timestamp", ["clientId", "timestamp"])
    .index("by_client_and_endpoint", ["clientId", "endpoint"]),

  // 16. Audit Logs (Tenant Scoped & Immutable)
  audit_logs: defineTable({
    auditId: v.string(),
    requestId: v.string(),
    clientId: v.string(),
    actorEmail: v.string(),
    actorRole: v.string(),
    action: v.string(),
    targetResource: v.string(),
    outcome: v.union(v.literal("SUCCESS"), v.literal("DENIED"), v.literal("FAILED")),
    metadata: v.optional(v.any()),
    timestamp: v.string(),
    createdAt: v.number(),
  })
    .index("by_client", ["clientId"])
    .index("by_client_and_action", ["clientId", "action"])
    .index("by_request_id", ["requestId"]),

  // 17. Application Error Logs
  error_logs: defineTable({
    errorId: v.string(),
    requestId: v.string(),
    clientId: v.string(),
    employeeId: v.optional(v.string()),
    apiName: v.string(),
    errorCode: v.string(),
    errorMessage: v.string(),
    stackTrace: v.optional(v.string()),
    environment: v.union(v.literal("DEV"), v.literal("UAT"), v.literal("PROD")),
    timestamp: v.string(),
    createdAt: v.number(),
  })
    .index("by_client", ["clientId"])
    .index("by_request_id", ["requestId"])
    .index("by_client_and_error_code", ["clientId", "errorCode"]),

  // 18. Notifications & Alerts
  notifications: defineTable({
    notificationId: v.string(),
    clientId: v.string(),
    title: v.string(),
    message: v.string(),
    category: v.union(v.literal("ATTENDANCE"), v.literal("BIOMETRIC"), v.literal("SECURITY"), v.literal("SYSTEM")),
    severity: v.union(v.literal("INFO"), v.literal("WARNING"), v.literal("CRITICAL")),
    isRead: v.boolean(),
    createdAt: v.string(),
  })
    .index("by_client", ["clientId"])
    .index("by_client_and_read", ["clientId", "isRead"]),

  // 19. Idempotency Keys (24h Deduplication)
  idempotencyKeys: defineTable({
    key: v.string(),
    clientId: v.string(),
    operation: v.string(),
    response: v.any(),
    createdAt: v.number(),
    expiresAt: v.number(),
  })
    .index("by_key", ["key"])
    .index("by_client", ["clientId"]),
});
