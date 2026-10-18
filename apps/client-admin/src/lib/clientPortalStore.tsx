"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  ClientAdminRole,
  ClientUser,
  ClientDepartment,
  ClientShift,
  ClientEmployee,
  ClientAttendanceRecord,
  ClientLocation,
  ClientSettings,
  ClientNotification,
  ClientAuditLog,
  ClientApiUsage,
} from "@/types/clientPortal";
import {
  INITIAL_CLIENT_SETTINGS,
  INITIAL_CLIENT_USERS,
  INITIAL_DEPARTMENTS,
  INITIAL_SHIFTS,
  INITIAL_EMPLOYEES,
  INITIAL_ATTENDANCE_RECORDS,
  INITIAL_LOCATIONS,
  INITIAL_NOTIFICATIONS,
  INITIAL_AUDIT_LOGS,
  INITIAL_API_USAGE,
} from "@/data/clientMockDatabase";

interface ClientPortalContextType {
  // Tenancy & Active Admin State
  activeClientId: string;
  setActiveClientId: (id: string) => void;
  availableClients: { clientId: string; companyName: string }[];
  activeUser: ClientUser;
  setActiveUserRole: (role: ClientAdminRole) => void;

  // Tenant-Scoped Data
  settings: ClientSettings;
  updateSettings: (newSettings: Partial<ClientSettings>) => void;
  featureFlags: {
    faceRegistration: boolean;
    faceVerification: boolean;
    attendance: boolean;
    gpsValidation: boolean;
    reports: boolean;
    notifications: boolean;
    payrollExport: boolean;
    strictLiveness: boolean;
  };

  // Employees
  employees: ClientEmployee[];
  addEmployee: (emp: Omit<ClientEmployee, "clientId" | "masterId" | "createdAt" | "status">) => void;
  updateEmployee: (empId: string, updates: Partial<ClientEmployee>) => void;
  enrollEmployeeFace: (empId: string, faceImageBase64: string) => Promise<{ success: boolean; faceId: string; qualityScore: number }>;
  removeEmployeeFace: (empId: string, reason: string) => void;

  // Departments & Shifts
  departments: ClientDepartment[];
  addDepartment: (name: string, managerName?: string) => void;
  shifts: ClientShift[];
  addShift: (shift: Omit<ClientShift, "shiftId" | "clientId" | "assignedEmployeesCount" | "status">) => void;

  // Attendance
  attendanceRecords: ClientAttendanceRecord[];
  correctAttendanceRecord: (
    attendanceId: string,
    adjustedCheckIn: string,
    adjustedCheckOut: string,
    reason: string
  ) => void;
  addManualPunch: (record: Omit<ClientAttendanceRecord, "attendanceId" | "clientId" | "requestId" | "status" | "isLate" | "locationVerified">) => void;

  // Locations / Geofencing
  locations: ClientLocation[];
  addLocation: (loc: Omit<ClientLocation, "locationId" | "clientId" | "status">) => void;

  // Users & Roles
  users: ClientUser[];
  allUsers: ClientUser[];
  addUser: (name: string, email: string, role: ClientAdminRole, departmentId?: string) => void;
  updateUserStatus: (userId: string, status: "ACTIVE" | "INACTIVE") => void;

  // Notifications
  notifications: ClientNotification[];
  markNotificationRead: (id: string) => void;

  // Audit & Telemetry
  auditLogs: ClientAuditLog[];
  apiUsage: ClientApiUsage[];

  // Utilities & Toast
  toastMessage: string | null;
  showToast: (msg: string) => void;
  exportAttendanceCsv: (startDate?: string, endDate?: string) => void;
}

const ClientPortalContext = createContext<ClientPortalContextType | undefined>(undefined);

export function ClientPortalProvider({ children }: { children: React.ReactNode }) {
  const [activeClientId, setActiveClientId] = useState<string>("ABC001");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Tenant collections
  const [settingsMap, setSettingsMap] = useState<Record<string, ClientSettings>>(INITIAL_CLIENT_SETTINGS);
  const [allUsers, setAllUsers] = useState<ClientUser[]>(INITIAL_CLIENT_USERS);
  const [allEmployees, setAllEmployees] = useState<ClientEmployee[]>(INITIAL_EMPLOYEES);
  const [allDepartments, setAllDepartments] = useState<ClientDepartment[]>(INITIAL_DEPARTMENTS);
  const [allShifts, setAllShifts] = useState<ClientShift[]>(INITIAL_SHIFTS);
  const [allAttendance, setAllAttendance] = useState<ClientAttendanceRecord[]>(INITIAL_ATTENDANCE_RECORDS);
  const [allLocations, setAllLocations] = useState<ClientLocation[]>(INITIAL_LOCATIONS);
  const [allNotifications, setAllNotifications] = useState<ClientNotification[]>(INITIAL_NOTIFICATIONS);
  const [allAuditLogs, setAllAuditLogs] = useState<ClientAuditLog[]>(INITIAL_AUDIT_LOGS);
  const [allApiUsage, setAllApiUsage] = useState<ClientApiUsage[]>(INITIAL_API_USAGE);

  // Available clients list
  const availableClients = [
    { clientId: "KARITECH_TEST", companyName: "Karitech Technologies (Test)" },
    { clientId: "KARITECH_PROD", companyName: "Karitech Technologies (Prod)" },
    { clientId: "ABC001", companyName: "ABC Technologies" },
    { clientId: "KSL042", companyName: "KSL Sburagi Tech Ltd" },
    { clientId: "NOV109", companyName: "Nova Retail Inc" },
  ];

  // Active client settings
  const settings = settingsMap[activeClientId] || {
    clientId: activeClientId,
    companyName: availableClients.find((c) => c.clientId === activeClientId)?.companyName || "Organization",
    officeStartTime: "09:00",
    officeEndTime: "18:00",
    lateThresholdMinutes: 15,
    timezone: "America/Los_Angeles",
    geofenceStrictEnforced: true,
    autoCheckoutAtMidnight: true,
    biometricRetentionDays: 90,
  };

  // Active feature flags from client
  const featureFlags = {
    faceRegistration: true,
    faceVerification: true,
    attendance: true,
    gpsValidation: true,
    reports: true,
    notifications: true,
    payrollExport: activeClientId !== "NOV109",
    strictLiveness: true,
  };

  // Active user (default to first matching activeClientId)
  const tenantUsers = allUsers.filter((u) => u.clientId === activeClientId);
  const [activeUser, setActiveUser] = useState<ClientUser>(
    tenantUsers[0] || {
      userId: `usr_${activeClientId}_admin`,
      clientId: activeClientId,
      name: "Master Administrator",
      email: `admin@${activeClientId.toLowerCase()}.example.com`,
      role: "PRIMARY_MASTER_ADMIN",
      status: "ACTIVE",
      permissions: ["all"],
      createdAt: new Date().toISOString(),
    }
  );

  // Sync active user when tenant changes
  useEffect(() => {
    const matching = allUsers.find((u) => u.clientId === activeClientId && u.role === "PRIMARY_MASTER_ADMIN");
    if (matching) {
      setActiveUser(matching);
    } else {
      setActiveUser({
        userId: `usr_${activeClientId}_admin`,
        clientId: activeClientId,
        name: "Master Administrator",
        email: `admin@${activeClientId.toLowerCase()}.internal`,
        role: "PRIMARY_MASTER_ADMIN",
        status: "ACTIVE",
        permissions: ["all"],
        createdAt: new Date().toISOString(),
      });
    }
  }, [activeClientId, allUsers]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const setActiveUserRole = (role: ClientAdminRole) => {
    setActiveUser((prev) => ({ ...prev, role }));
    showToast(`Role switched to ${role} for tenant ${activeClientId}.`);
  };

  const updateSettings = (newSettings: Partial<ClientSettings>) => {
    setSettingsMap((prev) => ({
      ...prev,
      [activeClientId]: { ...settings, ...newSettings },
    }));
    showToast("Company settings updated successfully.");
  };

  // Filtered collections strictly scoped to activeClientId
  const employees = allEmployees.filter((e) => e.clientId === activeClientId);
  const departments = allDepartments.filter((d) => d.clientId === activeClientId);
  const shifts = allShifts.filter((s) => s.clientId === activeClientId);
  const attendanceRecords = allAttendance.filter((a) => a.clientId === activeClientId);
  const locations = allLocations.filter((l) => l.clientId === activeClientId);
  const users = allUsers.filter((u) => u.clientId === activeClientId);
  const notifications = allNotifications.filter((n) => n.clientId === activeClientId);
  const auditLogs = allAuditLogs.filter((a) => a.clientId === activeClientId);
  const apiUsage = allApiUsage.filter((u) => u.clientId === activeClientId);

  // Add Employee
  const addEmployee = (empData: Omit<ClientEmployee, "clientId" | "masterId" | "createdAt" | "status">) => {
    const newEmp: ClientEmployee = {
      ...empData,
      clientId: activeClientId,
      masterId: activeUser.userId,
      status: "PENDING_FACE_REGISTRATION",
      createdAt: new Date().toISOString(),
    };
    setAllEmployees((prev) => [newEmp, ...prev]);

    // Add Audit Log
    const log: ClientAuditLog = {
      auditId: `aud_${Date.now()}`,
      requestId: `REQ-${Date.now()}`,
      clientId: activeClientId,
      actorEmail: activeUser.email,
      actorRole: activeUser.role,
      action: "CREATE_EMPLOYEE",
      targetResource: `employees/${newEmp.employeeId}`,
      outcome: "SUCCESS",
      metadata: { name: newEmp.name, department: newEmp.departmentName },
      timestamp: new Date().toISOString(),
    };
    setAllAuditLogs((prev) => [log, ...prev]);
    showToast(`Employee ${newEmp.name} (${newEmp.employeeId}) created. Awaiting biometric registration.`);
  };

  const updateEmployee = (empId: string, updates: Partial<ClientEmployee>) => {
    setAllEmployees((prev) =>
      prev.map((e) => (e.clientId === activeClientId && e.employeeId === empId ? { ...e, ...updates } : e))
    );
    showToast(`Employee ${empId} updated.`);
  };

  // Face Registration via Railway Face API contract
  const enrollEmployeeFace = async (
    empId: string,
    faceImageBase64: string
  ): Promise<{ success: boolean; faceId: string; qualityScore: number }> => {
    const faceId = `FACE_${activeClientId.toLowerCase()}_${Math.random().toString(36).substring(2, 9)}`;
    const qualityScore = Number((0.92 + Math.random() * 0.07).toFixed(3));

    await new Promise((resolve) => setTimeout(resolve, 800));

    setAllEmployees((prev) =>
      prev.map((e) =>
        e.clientId === activeClientId && e.employeeId === empId
          ? {
              ...e,
              faceId,
              faceRegisteredAt: new Date().toISOString(),
              faceQualityScore: qualityScore,
              status: "ACTIVE",
            }
          : e
      )
    );

    const log: ClientAuditLog = {
      auditId: `aud_${Date.now()}`,
      requestId: `REQ-${Date.now()}`,
      clientId: activeClientId,
      actorEmail: activeUser.email,
      actorRole: activeUser.role,
      action: "ENROLL_EMPLOYEE_BIOMETRICS",
      targetResource: `employees/${empId}`,
      outcome: "SUCCESS",
      metadata: { faceId, qualityScore },
      timestamp: new Date().toISOString(),
    };
    setAllAuditLogs((prev) => [log, ...prev]);

    showToast(`Biometric face enrolled for ${empId} with ${Math.round(qualityScore * 100)}% quality score.`);
    return { success: true, faceId, qualityScore };
  };

  const removeEmployeeFace = (empId: string, reason: string) => {
    setAllEmployees((prev) =>
      prev.map((e) =>
        e.clientId === activeClientId && e.employeeId === empId
          ? {
              ...e,
              faceId: undefined,
              faceRegisteredAt: undefined,
              faceQualityScore: undefined,
              status: "PENDING_FACE_REGISTRATION",
            }
          : e
      )
    );

    const log: ClientAuditLog = {
      auditId: `aud_${Date.now()}`,
      requestId: `REQ-${Date.now()}`,
      clientId: activeClientId,
      actorEmail: activeUser.email,
      actorRole: activeUser.role,
      action: "PURGE_BIOMETRIC_VECTOR",
      targetResource: `employees/${empId}`,
      outcome: "SUCCESS",
      metadata: { reason },
      timestamp: new Date().toISOString(),
    };
    setAllAuditLogs((prev) => [log, ...prev]);
    showToast(`Facial vector removed for ${empId}. Reason recorded in compliance audit log.`);
  };

  // Add Department
  const addDepartment = (name: string, managerName?: string) => {
    const deptId = `dept_${name.toLowerCase().replace(/\s+/g, "_")}`;
    const newDept: ClientDepartment = {
      departmentId: deptId,
      clientId: activeClientId,
      name,
      managerName,
      headcount: 0,
      createdAt: new Date().toISOString(),
    };
    setAllDepartments((prev) => [...prev, newDept]);
    showToast(`Department "${name}" created.`);
  };

  // Add Shift
  const addShift = (shiftData: Omit<ClientShift, "shiftId" | "clientId" | "assignedEmployeesCount" | "status">) => {
    const shiftId = `shift_${Date.now().toString(36)}`;
    const newShift: ClientShift = {
      ...shiftData,
      shiftId,
      clientId: activeClientId,
      assignedEmployeesCount: 0,
      status: "ACTIVE",
    };
    setAllShifts((prev) => [...prev, newShift]);
    showToast(`Shift "${newShift.name}" (${newShift.startTime} - ${newShift.endTime}) configured.`);
  };

  // Correct Attendance
  const correctAttendanceRecord = (
    attendanceId: string,
    adjustedCheckIn: string,
    adjustedCheckOut: string,
    reason: string
  ) => {
    const target = allAttendance.find((a) => a.attendanceId === attendanceId && a.clientId === activeClientId);
    if (!target) return;

    setAllAttendance((prev) =>
      prev.map((a) => {
        if (a.attendanceId === attendanceId && a.clientId === activeClientId) {
          return {
            ...a,
            checkInTime: adjustedCheckIn || a.checkInTime,
            checkOutTime: adjustedCheckOut || a.checkOutTime,
            status: "PRESENT",
            isLate: false,
            correctionLog: {
              correctedBy: activeUser.email,
              correctedAt: new Date().toISOString(),
              reason,
              previousCheckIn: a.checkInTime,
              previousCheckOut: a.checkOutTime,
            },
          };
        }
        return a;
      })
    );

    const log: ClientAuditLog = {
      auditId: `aud_${Date.now()}`,
      requestId: target.requestId,
      clientId: activeClientId,
      actorEmail: activeUser.email,
      actorRole: activeUser.role,
      action: "ATTENDANCE_MANUAL_CORRECTION",
      targetResource: `attendance/${attendanceId}`,
      outcome: "SUCCESS",
      metadata: {
        employeeId: target.employeeId,
        previousIn: target.checkInTime,
        adjustedIn: adjustedCheckIn,
        reason,
      },
      timestamp: new Date().toISOString(),
    };
    setAllAuditLogs((prev) => [log, ...prev]);
    showToast(`Attendance record ${attendanceId} corrected. Audit trail recorded.`);
  };

  // Add Manual Punch
  const addManualPunch = (
    record: Omit<ClientAttendanceRecord, "attendanceId" | "clientId" | "requestId" | "status" | "isLate" | "locationVerified">
  ) => {
    const newAtt: ClientAttendanceRecord = {
      ...record,
      attendanceId: `att_${Date.now()}`,
      clientId: activeClientId,
      requestId: `REQ-${Date.now()}`,
      status: "PRESENT",
      isLate: false,
      locationVerified: true,
    };
    setAllAttendance((prev) => [newAtt, ...prev]);
    showToast(`Punch recorded for ${record.employeeName}.`);
  };

  // Add Location
  const addLocation = (locData: Omit<ClientLocation, "locationId" | "clientId" | "status">) => {
    const locId = `loc_${Date.now().toString(36)}`;
    const newLoc: ClientLocation = {
      ...locData,
      locationId: locId,
      clientId: activeClientId,
      status: "ACTIVE",
    };
    setAllLocations((prev) => [...prev, newLoc]);
    showToast(`Location "${newLoc.name}" with ${newLoc.allowedRadiusMeters}m geofence saved.`);
  };

  // Add User
  const addUser = (name: string, email: string, role: ClientAdminRole, departmentId?: string) => {
    const newUser: ClientUser = {
      userId: `usr_${Date.now().toString(36)}`,
      clientId: activeClientId,
      name,
      email,
      role,
      departmentId,
      status: "ACTIVE",
      permissions: role === "PRIMARY_MASTER_ADMIN" ? ["all"] : ["employees.manage", "attendance.manage"],
      createdAt: new Date().toISOString(),
    };
    setAllUsers((prev) => [...prev, newUser]);
    showToast(`User ${name} added with ${role} permissions.`);
  };

  const updateUserStatus = (userId: string, status: "ACTIVE" | "INACTIVE") => {
    setAllUsers((prev) =>
      prev.map((u) => (u.userId === userId ? { ...u, status } : u))
    );
  };

  const markNotificationRead = (id: string) => {
    setAllNotifications((prev) =>
      prev.map((n) => (n.notificationId === id ? { ...n, isRead: true } : n))
    );
  };

  // CSV Export
  const exportAttendanceCsv = (startDate?: string, endDate?: string) => {
    const rows = attendanceRecords.filter((a) => {
      if (startDate && a.attendanceDate < startDate) return false;
      if (endDate && a.attendanceDate > endDate) return false;
      return true;
    });

    const headers = [
      "Attendance ID",
      "Employee ID",
      "Employee Name",
      "Department",
      "Date",
      "Check-In",
      "Check-Out",
      "Status",
      "Late",
      "Location Verified",
      "Location Name",
      "Request ID",
    ];

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [
        headers.join(","),
        ...rows.map((r) =>
          [
            r.attendanceId,
            r.employeeId,
            `"${r.employeeName}"`,
            `"${r.departmentName}"`,
            r.attendanceDate,
            r.checkInTime,
            r.checkOutTime || "",
            r.status,
            r.isLate ? "YES" : "NO",
            r.locationVerified ? "PASS" : "FAIL",
            `"${r.locationName || ""}"`,
            r.requestId,
          ].join(",")
        ),
      ].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `attendance_export_${activeClientId}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${rows.length} attendance records for ${activeClientId}.`);
  };

  return (
    <ClientPortalContext.Provider
      value={{
        activeClientId,
        setActiveClientId,
        availableClients,
        activeUser,
        setActiveUserRole,
        settings,
        updateSettings,
        featureFlags,
        employees,
        addEmployee,
        updateEmployee,
        enrollEmployeeFace,
        removeEmployeeFace,
        departments,
        addDepartment,
        shifts,
        addShift,
        attendanceRecords,
        correctAttendanceRecord,
        addManualPunch,
        locations,
        addLocation,
        users,
        allUsers,
        addUser,
        updateUserStatus,
        notifications,
        markNotificationRead,
        auditLogs,
        apiUsage,
        toastMessage,
        showToast,
        exportAttendanceCsv,
      }}
    >
      {children}
    </ClientPortalContext.Provider>
  );
}

export function useClientPortal() {
  const context = useContext(ClientPortalContext);
  if (!context) {
    throw new Error("useClientPortal must be used within a ClientPortalProvider");
  }
  return context;
}
