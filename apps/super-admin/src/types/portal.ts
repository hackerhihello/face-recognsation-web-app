// Enterprise Super Admin Portal Types

export type Environment = 'DEV' | 'UAT' | 'PROD';

export type TenantStatus = 'ACTIVE' | 'SUSPENDED' | 'TRIAL' | 'ARCHIVED';

export type MasterAdminStatus = 'ACTIVE' | 'INVITED' | 'DISABLED';

export type EmployeeStatus = 'ACTIVE' | 'PENDING_FACE_REGISTRATION' | 'TERMINATED';

export type TokenStatus = 'ACTIVE' | 'REVOKED' | 'EXPIRED';

export type SubscriptionPlanTier = 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE' | 'CUSTOM';

export interface ClientTenant {
  clientId: string; // e.g., "ABC001"
  companyName: string;
  companyLogo?: string;
  contactEmail: string;
  contactPhone?: string;
  status: TenantStatus;
  subscriptionPlan: SubscriptionPlanTier;
  timeZone: string;
  allowedEnvironments: Environment[];
  enabledFeatures: {
    faceRegistration: boolean;
    faceVerification: boolean;
    attendance: boolean;
    gpsValidation: boolean;
    reports: boolean;
    notifications: boolean;
    payrollExport: boolean;
    strictLiveness: boolean;
  };
  officeLocationsCount: number;
  totalEmployees: number;
  totalMasterAdmins: number;
  createdAt: string;
  updatedAt: string;
}

export interface MasterAdmin {
  masterId: string; // e.g., "MASTER001"
  clientId: string;
  companyName: string;
  name: string;
  email: string;
  phone?: string;
  role: 'PRIMARY_MASTER_ADMIN' | 'REGIONAL_ADMIN' | 'HR_OPERATIONS';
  status: MasterAdminStatus;
  twoFactorEnabled: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

export interface Employee {
  employeeId: string; // e.g., "EMP0098"
  clientId: string;
  companyName: string;
  masterId: string;
  faceId?: string; // Opaque reference to Cloudflare R2 vector
  name: string;
  email: string;
  department: string;
  designation: string;
  status: EmployeeStatus;
  faceRegisteredAt?: string;
  faceQualityScore?: number;
  lastPunchAt?: string;
  createdAt: string;
}

export interface OfficeLocation {
  locationId: string;
  clientId: string;
  name: string;
  latitude: number;
  longitude: number;
  allowedRadiusMeters: number;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface ApiTokenRecord {
  tokenId: string; // e.g., "tok_uat_abc9921"
  clientId: string;
  companyName: string;
  masterId: string;
  environment: Environment;
  tokenType: 'UAT_SANDBOX' | 'PRODUCTION_GATEWAY' | 'DEV_INTERNAL';
  maskedToken: string; // e.g. "uat_f9b8c2e1**********1234"
  tokenHash: string; // SHA-256 hash
  allocatedQuota: number;
  consumedQuota: number;
  remainingQuota: number;
  status: TokenStatus;
  createdAt: string;
  expiresAt: string;
  lastUsedAt?: string;
}

export interface TimelineEvent {
  time: string;
  stage: string;
  detail: string;
  status: 'ok' | 'fail' | 'info' | 'warn';
  durationMs?: number;
}

export interface RequestTraceRecord {
  requestId: string; // e.g., "REQ-20261006-000001"
  correlationId?: string;
  clientId: string;
  companyName: string;
  masterId: string;
  masterAdminName?: string;
  employeeId?: string;
  employeeName?: string;
  faceId?: string;
  apiName: string;
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  endpoint: string;
  environment: Environment;
  httpStatus: number;
  status: 'Success' | 'Failed';
  responseTimeMs: number;
  timestamp: string;
  tokenId: string;
  tokensConsumed: number;
  remainingTokensAfter: number;
  idempotencyKey?: string;
  isRetry?: boolean;
  errorCode?: string;
  errorMessage?: string;
  failureStage?: string;
  recommendedDiagnostics?: string[];
  enabledApisAtRequest: string[];
  timeline: TimelineEvent[];
}

export interface AuditLogEntry {
  auditId: string;
  requestId: string;
  actorEmail: string;
  actorRole: 'SUPER_ADMIN' | 'MASTER_ADMIN' | 'SYSTEM_JOB';
  targetResource: string;
  action: string;
  clientId?: string;
  companyName?: string;
  environment: Environment;
  outcome: 'SUCCESS' | 'DENIED' | 'FAILED';
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface ErrorLogEntry {
  errorId: string;
  requestId: string;
  clientId: string;
  companyName: string;
  masterId?: string;
  employeeId?: string;
  apiName: string;
  endpoint: string;
  environment: Environment;
  errorCode: string;
  safeMessage: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  httpStatus: number;
  durationMs: number;
  timestamp: string;
}

export interface ApiEndpointConfig {
  id: string;
  name: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  environment: Environment;
  isEnabled: boolean;
  rateLimitPerMin: number;
  requiredScope: string;
  p95LatencyMs: number;
  errorRatePercent: number;
  lastUpdated: string;
}

export interface SystemServiceHealth {
  serviceId: string;
  name: string;
  component: string;
  infrastructure: string;
  status: 'OPERATIONAL' | 'DEGRADED' | 'MAINTENANCE' | 'DOWN';
  uptimePercent: number;
  latencyMs: number;
  region: string;
  lastChecked: string;
}
