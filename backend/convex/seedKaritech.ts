import { mutation } from "./_generated/server";
import { generateApiKey, sha256Hash, maskToken, encryptCredential } from "./lib/crypto";
import { generateRequestId } from "./lib/requestId";

export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const secret = process.env.CREDENTIAL_ENCRYPTION_SECRET || "default_secret";
    const results: any[] = [];

    const clientsToSeed = [
      {
        clientId: "KARITECH_TEST",
        companyName: "Karitech Technologies (Test)",
        contactEmail: "test@karitech.com",
        contactPhone: "+91 80 4910 8801",
        subscriptionPlan: "ENTERPRISE" as const,
        timeZone: "Asia/Kolkata",
        allowedEnvironments: ["DEV", "UAT"] as ("DEV" | "UAT" | "PROD")[],
        faceApiRegion: "ka",
        masterAdminName: "Karitech Test Admin",
        masterAdminEmail: "admin.test@karitech.com",
        masterAdminPhone: "+91 80 4910 8801",
        defaultDeptName: "QA & Testing",
        empId: "EMP_KARI_TEST_01",
        empName: "Test User",
        empEmail: "user.test@karitech.com",
        empRole: "QA Test Engineer",
        tokenEnv: "UAT" as const,
        tokenName: "Karitech Test UAT Key",
      },
      {
        clientId: "KARITECH_PROD",
        companyName: "Karitech Technologies (Prod)",
        contactEmail: "prod@karitech.com",
        contactPhone: "+91 80 4910 8802",
        subscriptionPlan: "ENTERPRISE" as const,
        timeZone: "Asia/Kolkata",
        allowedEnvironments: ["PROD"] as ("DEV" | "UAT" | "PROD")[],
        faceApiRegion: "ka",
        masterAdminName: "Karitech Prod Admin",
        masterAdminEmail: "admin.prod@karitech.com",
        masterAdminPhone: "+91 80 4910 8802",
        defaultDeptName: "Production Operations",
        empId: "EMP_KARI_PROD_01",
        empName: "Prod User",
        empEmail: "user.prod@karitech.com",
        empRole: "Production Staff",
        tokenEnv: "PROD" as const,
        tokenName: "Karitech Production Live Key",
      },
    ];

    for (const c of clientsToSeed) {
      // 1. Check or insert Client
      let client = await ctx.db
        .query("clients")
        .withIndex("by_client_id", (q) => q.eq("clientId", c.clientId))
        .first();

      if (!client) {
        const clientDbId = await ctx.db.insert("clients", {
          clientId: c.clientId,
          companyName: c.companyName,
          contactEmail: c.contactEmail,
          contactPhone: c.contactPhone,
          status: "ACTIVE",
          subscriptionPlan: c.subscriptionPlan,
          timeZone: c.timeZone,
          allowedEnvironments: c.allowedEnvironments,
          faceApiRegion: c.faceApiRegion,
          createdAt: now,
          updatedAt: now,
        });

        // Master Admin
        const masterId = `MASTER_${c.clientId}_001`;
        await ctx.db.insert("masterAdmins", {
          masterId,
          clientId: c.clientId,
          name: c.masterAdminName,
          email: c.masterAdminEmail,
          phone: c.masterAdminPhone,
          role: "PRIMARY_MASTER_ADMIN",
          status: "ACTIVE",
          twoFactorEnabled: false,
          createdAt: now,
        });

        // Client User
        await ctx.db.insert("clientUsers", {
          userId: `usr_${c.clientId.toLowerCase()}_01`,
          clientId: c.clientId,
          name: c.masterAdminName,
          email: c.masterAdminEmail,
          role: "MASTER_ADMIN",
          status: "ACTIVE",
          permissions: ["all"],
          createdAt: now,
        });

        // Default Client Settings
        await ctx.db.insert("clientSettings", {
          clientId: c.clientId,
          officeStartTime: "09:30",
          officeEndTime: "18:30",
          lateThresholdMinutes: 15,
          timezone: c.timeZone,
          geofenceStrictEnforced: false,
          autoCheckoutAtMidnight: true,
          biometricRetentionDays: 365,
          minMatchScore: 85.0,
          maxMatchDistance: 0.35,
        });

        // Attendance Policy
        await ctx.db.insert("attendancePolicies", {
          policyId: `pol_${c.clientId.toLowerCase()}`,
          clientId: c.clientId,
          minWorkingHoursStandard: 8,
          halfDayHours: 4,
          overtimeThresholdMinutes: 540,
          requireGeofence: false,
          allowManualCorrection: true,
          maxLateAllowedPerMonth: 3,
          updatedAt: now,
        });

        // Feature flags
        await ctx.db.insert("feature_flags", {
          clientId: c.clientId,
          faceRegistration: true,
          faceVerification: true,
          attendance: true,
          gpsValidation: true,
          reports: true,
          notifications: true,
          payrollExport: true,
          strictLiveness: false,
          apiAccess: true,
        });

        // Department
        const departmentId = `dept_${c.clientId.toLowerCase()}_01`;
        await ctx.db.insert("departments", {
          departmentId,
          clientId: c.clientId,
          name: c.defaultDeptName,
          managerName: c.masterAdminName,
          headcount: 1,
          createdAt: now,
        });

        // Shift
        const shiftId = `shift_${c.clientId.toLowerCase()}_01`;
        await ctx.db.insert("shifts", {
          shiftId,
          clientId: c.clientId,
          name: "General Regular Shift",
          startTime: "09:30",
          endTime: "18:30",
          gracePeriodMinutes: 15,
          halfDayThresholdMinutes: 240,
          assignedEmployeesCount: 1,
          status: "ACTIVE",
          createdAt: now,
        });

        // Location
        await ctx.db.insert("locations", {
          locationId: `loc_${c.clientId.toLowerCase()}_01`,
          clientId: c.clientId,
          name: "Main HQ Office",
          address: "Kalaburagi Technology Park, Karnataka",
          latitude: 17.3297,
          longitude: 76.8343,
          allowedRadiusMeters: 500,
          status: "ACTIVE",
          createdAt: now,
        });

        // Employee
        await ctx.db.insert("employees", {
          employeeId: c.empId,
          clientId: c.clientId,
          masterId,
          name: c.empName,
          email: c.empEmail,
          phone: "+91 98765 43210",
          departmentId,
          departmentName: c.defaultDeptName,
          designation: c.empRole,
          empRank: c.empRole,
          shiftId,
          biometricConsentGiven: false,
          status: "PENDING_FACE_REGISTRATION",
          createdAt: now,
          updatedAt: now,
        });

        // API Token
        const rawSecret = generateApiKey(c.tokenEnv);
        const tokenHash = await sha256Hash(rawSecret);
        const tokenMasked = maskToken(rawSecret);
        const tokenId = `tok_${c.clientId.toLowerCase()}_${Date.now().toString(36)}`;

        await ctx.db.insert("api_tokens", {
          tokenId,
          clientId: c.clientId,
          masterId,
          name: c.tokenName,
          tokenHash,
          tokenMasked,
          environment: c.tokenEnv,
          allocatedTokens: 100000,
          usedTokens: 0,
          remainingTokens: 100000,
          status: "ACTIVE",
          createdAt: now,
        });

        results.push({
          clientId: c.clientId,
          companyName: c.companyName,
          masterAdmin: {
            masterId,
            name: c.masterAdminName,
            email: c.masterAdminEmail,
          },
          testUserEmployee: {
            employeeId: c.empId,
            name: c.empName,
            email: c.empEmail,
            department: c.defaultDeptName,
            designation: c.empRole,
            status: "PENDING_FACE_REGISTRATION",
          },
          apiToken: {
            tokenId,
            name: c.tokenName,
            environment: c.tokenEnv,
            plaintextApiKey: rawSecret,
            tokenMasked,
          },
        });
      } else {
        results.push({
          clientId: c.clientId,
          status: "Already exists",
        });
      }
    }

    return results;
  },
});
