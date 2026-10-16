// Role and permission model. Role names match the Convex backend
// (`convex/lib/auth.ts` Role and `clientUsers.role`).
//
// UI checks here only decide what to show. Every privileged operation must
// also be authorized on the backend against the authenticated identity.

export type PlatformRole = "SUPER_ADMIN";
export type ClientRole = "MASTER_ADMIN" | "HR_ADMIN" | "DEPARTMENT_MANAGER";
export type Role = PlatformRole | ClientRole | "EMPLOYEE";

export const CLIENT_ROLES: readonly ClientRole[] = ["MASTER_ADMIN", "HR_ADMIN", "DEPARTMENT_MANAGER"];

export type Permission =
  | "dashboard.view"
  | "employees.view"
  | "employees.manage"
  | "faces.register"
  | "attendance.view"
  | "attendance.correct"
  | "reports.view"
  | "settings.manage";

const CLIENT_ROLE_PERMISSIONS: Record<ClientRole, readonly Permission[]> = {
  MASTER_ADMIN: [
    "dashboard.view",
    "employees.view",
    "employees.manage",
    "faces.register",
    "attendance.view",
    "attendance.correct",
    "reports.view",
    "settings.manage",
  ],
  HR_ADMIN: [
    "dashboard.view",
    "employees.view",
    "employees.manage",
    "faces.register",
    "attendance.view",
    "attendance.correct",
    "reports.view",
  ],
  DEPARTMENT_MANAGER: ["dashboard.view", "employees.view", "attendance.view", "reports.view"],
};

export function isClientRole(role: Role): role is ClientRole {
  return (CLIENT_ROLES as readonly string[]).includes(role);
}

/** Client permissions are never granted to platform roles, and vice versa. */
export function hasPermission(role: Role, permission: Permission): boolean {
  if (!isClientRole(role)) return false;
  return CLIENT_ROLE_PERMISSIONS[role].includes(permission);
}

export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: "Super Admin",
  MASTER_ADMIN: "Master Admin",
  HR_ADMIN: "HR Admin",
  DEPARTMENT_MANAGER: "Department Manager",
  EMPLOYEE: "Employee",
};
