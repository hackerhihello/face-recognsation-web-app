// Convex Employee Self-Service Backend: Profile, Punch History, and Biometric Consent

import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { generateRequestId } from "./lib/requestId";

/**
 * Employee Profile with biometric registration and shift details
 */
export const getProfile = query({
  args: {
    clientId: v.string(),
    employeeId: v.string(),
  },
  handler: async (ctx, args) => {
    const employee = await ctx.db
      .query("employees")
      .withIndex("by_client_and_emp_id", (q) =>
        q.eq("clientId", args.clientId).eq("employeeId", args.employeeId)
      )
      .first();

    if (!employee) return null;

    let shiftInfo = null;
    if (employee.shiftId) {
      shiftInfo = await ctx.db
        .query("shifts")
        .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
        .filter((q) => q.eq(q.field("shiftId"), employee.shiftId))
        .first();
    }

    return {
      employeeId: employee.employeeId,
      clientId: employee.clientId,
      name: employee.name,
      email: employee.email,
      phone: employee.phone,
      departmentId: employee.departmentId,
      departmentName: employee.departmentName,
      designation: employee.designation,
      status: employee.status,
      biometricStatus: {
        isFaceRegistered: Boolean(employee.faceId),
        faceRegisteredAt: employee.faceRegisteredAt,
        consentGiven: employee.biometricConsentGiven,
        consentDate: employee.biometricConsentDate,
      },
      shift: shiftInfo
        ? {
            name: shiftInfo.name,
            startTime: shiftInfo.startTime,
            endTime: shiftInfo.endTime,
            graceMinutes: shiftInfo.gracePeriodMinutes,
          }
        : null,
      lastPunchAt: employee.lastPunchAt,
    };
  },
});

/**
 * Employee Today's Punch Card Status
 */
export const getMyTodayStatus = query({
  args: {
    clientId: v.string(),
    employeeId: v.string(),
  },
  handler: async (ctx, args) => {
    const today = new Date().toISOString().split("T")[0];

    const todayPunch = await ctx.db
      .query("attendance")
      .withIndex("by_client_emp_date", (q) =>
        q
          .eq("clientId", args.clientId)
          .eq("employeeId", args.employeeId)
          .eq("attendanceDate", today)
      )
      .first();

    if (!todayPunch) {
      return {
        hasPunchedToday: false,
        status: "NOT_CHECKED_IN",
        checkInTime: null,
        checkOutTime: null,
        activeMinutes: 0,
      };
    }

    let activeMinutes = todayPunch.activeMinutes || 0;
    if (todayPunch.checkInTime && !todayPunch.checkOutTime) {
      const startMs = new Date(todayPunch.checkInTime).getTime();
      activeMinutes = Math.max(1, Math.round((Date.now() - startMs) / (60 * 1000)));
    }

    return {
      hasPunchedToday: true,
      attendanceId: todayPunch.attendanceId,
      status: todayPunch.status,
      isLate: todayPunch.isLate,
      checkInTime: todayPunch.checkInTime,
      checkOutTime: todayPunch.checkOutTime,
      activeMinutes,
      locationVerified: todayPunch.locationVerified,
      locationName: todayPunch.locationName,
    };
  },
});

/**
 * Personal Historical Punch Records
 */
export const getMyAttendanceHistory = query({
  args: {
    clientId: v.string(),
    employeeId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const records = await ctx.db
      .query("attendance")
      .withIndex("by_client_and_employee", (q) =>
        q.eq("clientId", args.clientId).eq("employeeId", args.employeeId)
      )
      .collect();

    records.sort((a, b) => b.createdAt - a.createdAt);
    return args.limit ? records.slice(0, args.limit) : records;
  },
});

/**
 * Explicit Biometric Consent Acknowledgement
 */
export const acknowledgeBiometricConsent = mutation({
  args: {
    clientId: v.string(),
    employeeId: v.string(),
  },
  handler: async (ctx, args) => {
    const employee = await ctx.db
      .query("employees")
      .withIndex("by_client_and_emp_id", (q) =>
        q.eq("clientId", args.clientId).eq("employeeId", args.employeeId)
      )
      .first();

    if (!employee) throw new Error("Employee not found.");

    const now = new Date().toISOString();
    await ctx.db.patch(employee._id, {
      biometricConsentGiven: true,
      biometricConsentDate: now,
      updatedAt: Date.now(),
    });

    await ctx.db.insert("audit_logs", {
      auditId: `aud_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
      requestId: generateRequestId(),
      clientId: args.clientId,
      actorEmail: employee.email,
      actorRole: "EMPLOYEE",
      action: "BIOMETRIC_CONSENT_ACKNOWLEDGED",
      targetResource: `employee:${args.employeeId}`,
      outcome: "SUCCESS",
      timestamp: now,
      createdAt: Date.now(),
    });

    return true;
  },
});
