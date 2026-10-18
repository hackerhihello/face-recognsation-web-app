import { httpFaceService } from "./faceHttp";
import { sampleAdapter } from "./sample/sampleAdapter";
import { ServiceError, type DataService, type DataSourceKind } from "./types";

export * from "./types";

/**
 * Selected at build time with NEXT_PUBLIC_DATA_SOURCE. Defaults to "sample".
 *
 * "convex" is intentionally not wired yet: the current Convex functions accept
 * clientId and actorEmail from the caller without checking ctx.auth, so the
 * browser must not call them until server-side identity and tenant checks exist.
 */
export const DATA_SOURCE: DataSourceKind = process.env.NEXT_PUBLIC_DATA_SOURCE === "convex" ? "convex" : "sample";

const notConfigured = () =>
  Promise.reject(new ServiceError("The Convex data source is not connected yet.", "NOT_CONFIGURED"));

const convexPlaceholder: DataService = {
  kind: "convex",
  listDepartments: notConfigured,
  getDashboard: notConfigured,
  listEmployees: notConfigured,
  getEmployee: notConfigured,
  createEmployee: notConfigured,
  updateEmployee: notConfigured,
  listEmployeeAttendance: notConfigured,
  // Face calls already go through this app's session-checked /api/face proxy.
  ...httpFaceService,
};

export const dataService: DataService = DATA_SOURCE === "convex" ? convexPlaceholder : sampleAdapter;
