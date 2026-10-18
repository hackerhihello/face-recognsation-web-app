// Convex Attendance Engine: Transactions, Shift Logic, Idempotency, and Corrections

import { mutation, query, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { generateRequestId } from "./lib/requestId";
import { decryptCredential } from "./lib/crypto";

/**
 * Internal: retrieve tenant policy, locations, shift, and employee details for attendance validation
 */
export const getAttendanceContext = internalQuery({
  args: {
    clientId: v.string(),
    employeeId: v.string(),
  },
  handler: async (ctx, args) => {
    const client = await ctx.db
      .query("clients")
      .withIndex("by_client_id", (q) => q.eq("clientId", args.clientId))
      .first();

    if (!client) {
      throw new Error(`Client organization '${args.clientId}' not found.`);
    }

    if (client.status !== "ACTIVE") {
      throw new Error(`Client organization '${args.clientId}' is ${client.status.toLowerCase()}.`);
    }

    const employee = await ctx.db
      .query("employees")
      .withIndex("by_client_and_emp_id", (q) =>
        q.eq("clientId", args.clientId).eq("employeeId", args.employeeId)
      )
      .first();

    if (!employee) {
      throw new Error(`Employee '${args.employeeId}' does not exist in tenant '${args.clientId}'.`);
    }

    if (employee.status !== "ACTIVE") {
      throw new Error(`Employee '${args.employeeId}' is not active (status: ${employee.status}).`);
    }

    // Tenant policy & settings
    const settings = await ctx.db
      .query("clientSettings")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .first();

    const policy = await ctx.db
      .query("attendancePolicies")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .first();

    const locations = await ctx.db
      .query("locations")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();

    // Assigned shift if any
    let shift = null;
    if (employee.shiftId) {
      shift = await ctx.db
        .query("shifts")
        .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
        .filter((q) => q.eq(q.field("shiftId"), employee.shiftId))
        .first();
    }

    // Resolve tenant API key
    let resolvedApiKey = "";
    if (client.faceApiKeyEncrypted) {
      const secret = process.env.CREDENTIAL_ENCRYPTION_SECRET || "default_secret";
      resolvedApiKey = decryptCredential(client.faceApiKeyEncrypted, secret);
    }
    if (!resolvedApiKey) {
      resolvedApiKey = process.env.FACE_API_DEFAULT_KEY || "";
    }

    return {
      client: {
        clientId: client.clientId,
        companyName: client.companyName,
        region: client.faceApiRegion || "ka",
        hasApiKey: Boolean(resolvedApiKey),
        resolvedApiKey,
      },
      employee: {
        _id: employee._id,
        employeeId: employee.employeeId,
        name: employee.name,
        departmentName: employee.departmentName,
        shiftId: employee.shiftId,
        faceEncodingId: employee.faceEncodingId,
      },
      settings: settings || {
        officeStartTime: "09:00",
        officeEndTime: "18:00",
        lateThresholdMinutes: 15,
        timezone: "Asia/Kolkata",
        geofenceStrictEnforced: false,
        autoCheckoutAtMidnight: true,
        biometricRetentionDays: 365,
        minMatchScore: 85.0,
        maxMatchDistance: 0.35,
      },
      policy: policy || {
        minWorkingHoursStandard: 8,
        halfDayHours: 4,
        overtimeThresholdMinutes: 540,
        requireGeofence: false,
        allowManualCorrection: true,
        maxLateAllowedPerMonth: 3,
      },
      locations: locations.map((loc) => ({
        locationId: loc.locationId,
        name: loc.name,
        latitude: loc.latitude,
        longitude: loc.longitude,
        allowedRadiusMeters: loc.allowedRadiusMeters,
        status: loc.status,
      })),
      shift,
    };
  },
});

/**
 * Internal: transactional atomic check-in execution
 */
export const executeCheckIn = internalMutation({
  args: {
    clientId: v.string(),
    employeeId: v.string(),
    requestId: v.string(),
    idempotencyKey: v.optional(v.string()),
    verificationScore: v.number(),
    faceDistance: v.number(),
    locationVerified: v.boolean(),
    locationName: v.optional(v.string()),
    distanceMeters: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = new Date();
    const attendanceDate = now.toISOString().split("T")[0]; // YYYY-MM-DD
    const checkInTime = now.toISOString();

    const employee = await ctx.db
      .query("employees")
      .withIndex("by_client_and_emp_id", (q) =>
        q.eq("clientId", args.clientId).eq("employeeId", args.employeeId)
      )
      .first();

    if (!employee) throw new Error("Employee not found.");

    // Check for existing punch on the same date
    const existing = await ctx.db
      .query("attendance")
      .withIndex("by_client_emp_date", (q) =>
        q
          .eq("clientId", args.clientId)
          .eq("employeeId", args.employeeId)
          .eq("attendanceDate", attendanceDate)
      )
      .first();

    if (existing) {
      // Idempotent return: already checked in today
      return {
        alreadyCheckedIn: true,
        attendanceId: existing.attendanceId,
        status: existing.status,
        checkInTime: existing.checkInTime,
        checkOutTime: existing.checkOutTime,
        isLate: existing.isLate,
        message: existing.checkOutTime
          ? "Employee has already checked out for today."
          : "Employee is already checked in for today.",
      };
    }

    // Determine late status based on office start time
    const settings = await ctx.db
      .query("clientSettings")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .first();

    const startTimeStr = settings?.officeStartTime || "09:00";
    const graceMinutes = settings?.lateThresholdMinutes || 15;

    const [startHour, startMin] = startTimeStr.split(":").map(Number);
    const startWindow = new Date(now);
    startWindow.setHours(startHour, startMin + graceMinutes, 0, 0);

    const isLate = now.getTime() > startWindow.getTime();
    const status = isLate ? "LATE" : "PRESENT";

    const attendanceId = `att_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;

    await ctx.db.insert("attendance", {
      attendanceId,
      clientId: args.clientId,
      employeeId: args.employeeId,
      employeeName: employee.name,
      departmentName: employee.departmentName,
      attendanceDate,
      checkInTime,
      status,
      isLate,
      locationVerified: args.locationVerified,
      locationName: args.locationName,
      distanceMeters: args.distanceMeters,
      verificationScore: args.verificationScore,
      faceDistance: args.faceDistance,
      requestId: args.requestId,
      idempotencyKey: args.idempotencyKey,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Update employee last punch timestamp
    await ctx.db.patch(employee._id, {
      lastPunchAt: checkInTime,
      updatedAt: Date.now(),
    });

    return {
      alreadyCheckedIn: false,
      attendanceId,
      status,
      checkInTime,
      isLate,
      message: isLate ? "Check-in successful (Marked as Late)" : "Check-in successful",
    };
  },
});

/**
 * Internal: transactional atomic check-out execution
 */
export const executeCheckOut = internalMutation({
  args: {
    clientId: v.string(),
    employeeId: v.string(),
    requestId: v.string(),
    idempotencyKey: v.optional(v.string()),
    verificationScore: v.number(),
    faceDistance: v.number(),
    locationVerified: v.boolean(),
    locationName: v.optional(v.string()),
    distanceMeters: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = new Date();
    const attendanceDate = now.toISOString().split("T")[0];
    const checkOutTime = now.toISOString();

    const employee = await ctx.db
      .query("employees")
      .withIndex("by_client_and_emp_id", (q) =>
        q.eq("clientId", args.clientId).eq("employeeId", args.employeeId)
      )
      .first();

    if (!employee) throw new Error("Employee not found.");

    // Find today's open attendance punch
    const openPunch = await ctx.db
      .query("attendance")
      .withIndex("by_client_emp_date", (q) =>
        q
          .eq("clientId", args.clientId)
          .eq("employeeId", args.employeeId)
          .eq("attendanceDate", attendanceDate)
      )
      .first();

    if (!openPunch) {
      throw new Error("NoCheckInFound: Cannot check out without a valid check-in record for today.");
    }

    if (openPunch.checkOutTime) {
      return {
        alreadyCheckedOut: true,
        attendanceId: openPunch.attendanceId,
        status: openPunch.status,
        checkInTime: openPunch.checkInTime,
        checkOutTime: openPunch.checkOutTime,
        activeMinutes: openPunch.activeMinutes,
        message: "Employee has already checked out for today.",
      };
    }

    // Calculate active duration in minutes
    const checkInMs = new Date(openPunch.checkInTime).getTime();
    const checkOutMs = now.getTime();
    const activeMinutes = Math.max(1, Math.round((checkOutMs - checkInMs) / (60 * 1000)));

    // Shift & half-day duration evaluation
    let finalStatus = openPunch.status;
    const policy = await ctx.db
      .query("attendancePolicies")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .first();

    const halfDayThreshold = (policy?.halfDayHours || 4) * 60;
    const overtimeThreshold = policy?.overtimeThresholdMinutes || 540;

    if (activeMinutes < halfDayThreshold) {
      finalStatus = "HALF_DAY";
    } else if (activeMinutes >= overtimeThreshold && finalStatus !== "LATE") {
      finalStatus = "OVERTIME";
    }

    await ctx.db.patch(openPunch._id, {
      checkOutTime,
      activeMinutes,
      status: finalStatus,
      updatedAt: Date.now(),
    });

    await ctx.db.patch(employee._id, {
      lastPunchAt: checkOutTime,
      updatedAt: Date.now(),
    });

    return {
      alreadyCheckedOut: false,
      attendanceId: openPunch.attendanceId,
      status: finalStatus,
      checkInTime: openPunch.checkInTime,
      checkOutTime,
      activeMinutes,
      message: `Check-out successful. Total active time: ${Math.floor(activeMinutes / 60)}h ${activeMinutes % 60}m.`,
    };
  },
});

/**
 * Public Mutation: Authorized attendance manual correction by Master Admin or HR Admin
 */
export const correctAttendance = mutation({
  args: {
    clientId: v.string(),
    attendanceId: v.string(),
    correctedCheckIn: v.optional(v.string()),
    correctedCheckOut: v.optional(v.string()),
    correctedStatus: v.optional(
      v.union(v.literal("PRESENT"), v.literal("LATE"), v.literal("HALF_DAY"), v.literal("ABSENT"), v.literal("OVERTIME"))
    ),
    reason: v.string(),
    actorEmail: v.string(),
    actorRole: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. Authorization check
    if (args.actorRole !== "SUPER_ADMIN" && args.actorRole !== "MASTER_ADMIN" && args.actorRole !== "HR_ADMIN") {
      throw new Error("Unauthorized: Only Admins can submit attendance corrections.");
    }

    const record = await ctx.db
      .query("attendance")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .filter((q) => q.eq(q.field("attendanceId"), args.attendanceId))
      .first();

    if (!record) {
      throw new Error(`Attendance record '${args.attendanceId}' not found.`);
    }

    const previousCheckIn = record.checkInTime;
    const previousCheckOut = record.checkOutTime;
    const previousStatus = record.status;

    let newCheckIn = args.correctedCheckIn || record.checkInTime;
    let newCheckOut = args.correctedCheckOut || record.checkOutTime;
    let newStatus = args.correctedStatus || record.status;
    let activeMinutes = record.activeMinutes;

    if (newCheckIn && newCheckOut) {
      const inMs = new Date(newCheckIn).getTime();
      const outMs = new Date(newCheckOut).getTime();
      activeMinutes = Math.max(0, Math.round((outMs - inMs) / (60 * 1000)));
    }

    await ctx.db.patch(record._id, {
      checkInTime: newCheckIn,
      checkOutTime: newCheckOut,
      status: newStatus,
      activeMinutes,
      correctionLog: {
        correctedBy: args.actorEmail,
        correctedAt: new Date().toISOString(),
        reason: args.reason,
        previousCheckIn,
        previousCheckOut,
        previousStatus,
      },
      updatedAt: Date.now(),
    });

    // Record audit log
    const auditId = `aud_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    await ctx.db.insert("audit_logs", {
      auditId,
      requestId: generateRequestId(),
      clientId: args.clientId,
      actorEmail: args.actorEmail,
      actorRole: args.actorRole,
      action: "ATTENDANCE_CORRECTED",
      targetResource: `attendance:${args.attendanceId}`,
      outcome: "SUCCESS",
      metadata: {
        reason: args.reason,
        previous: { checkIn: previousCheckIn, checkOut: previousCheckOut, status: previousStatus },
        corrected: { checkIn: newCheckIn, checkOut: newCheckOut, status: newStatus },
      },
      timestamp: new Date().toISOString(),
      createdAt: Date.now(),
    });

    return { success: true, attendanceId: args.attendanceId };
  },
});

/**
 * Public Query: Retrieve historical attendance records for reporting & dashboards
 */
export const getAttendanceHistory = query({
  args: {
    clientId: v.string(),
    startDate: v.optional(v.string()), // "YYYY-MM-DD"
    endDate: v.optional(v.string()), // "YYYY-MM-DD"
    employeeId: v.optional(v.string()),
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db
      .query("attendance")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId));

    const records = await q.collect();

    // In-memory filter for flexible date ranges & employee
    let filtered = records;
    if (args.startDate) {
      filtered = filtered.filter((r) => r.attendanceDate >= args.startDate!);
    }
    if (args.endDate) {
      filtered = filtered.filter((r) => r.attendanceDate <= args.endDate!);
    }
    if (args.employeeId) {
      filtered = filtered.filter((r) => r.employeeId === args.employeeId);
    }
    if (args.status && args.status !== "ALL") {
      filtered = filtered.filter((r) => r.status === args.status);
    }

    filtered.sort((a, b) => b.createdAt - a.createdAt);

    if (args.limit) {
      filtered = filtered.slice(0, args.limit);
    }

    return filtered;
  },
});

/**
 * Public Query: Retrieve today's attendance summary for dashboard
 */
export const getTodayAttendanceStats = query({
  args: {
    clientId: v.string(),
  },
  handler: async (ctx, args) => {
    const today = new Date().toISOString().split("T")[0];

    const records = await ctx.db
      .query("attendance")
      .withIndex("by_client_and_date", (q) =>
        q.eq("clientId", args.clientId).eq("attendanceDate", today)
      )
      .collect();

    const totalPresent = records.filter((r) => r.status === "PRESENT").length;
    const totalLate = records.filter((r) => r.status === "LATE").length;
    const totalHalfDay = records.filter((r) => r.status === "HALF_DAY").length;
    const totalOvertime = records.filter((r) => r.status === "OVERTIME").length;
    const currentlyCheckedIn = records.filter((r) => !r.checkOutTime).length;

    // Total employees count for tenant
    const totalEmployees = await ctx.db
      .query("employees")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .filter((q) => q.eq(q.field("status"), "ACTIVE"))
      .collect();

    return {
      today,
      totalHeadcount: totalEmployees.length,
      totalPunches: records.length,
      present: totalPresent,
      late: totalLate,
      halfDay: totalHalfDay,
      overtime: totalOvertime,
      currentlyInOffice: currentlyCheckedIn,
      absentEstimated: Math.max(0, totalEmployees.length - records.length),
    };
  },
});
