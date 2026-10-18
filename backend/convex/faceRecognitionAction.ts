"use node";

// Convex Server-Side Action: Face Recognition & Biometric Attendance Punch
// Calls POST /api/recognize on https://api.kalaburagitech.com and applies strict attendance policies

import { action } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { FaceApiClient, base64ToUint8Array } from "./lib/faceApiClient";
import { verifyGeofence } from "./lib/geofence";
import { generateRequestId } from "./lib/requestId";

export const processFacePunch = action({
  args: {
    clientId: v.string(),
    employeeId: v.optional(v.string()), // Target employee ID if 1:1, or auto-detected if 1:N
    imageBase64: v.optional(v.string()),
    storageId: v.optional(v.id("_storage")),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    actionType: v.union(v.literal("CHECK_IN"), v.literal("CHECK_OUT"), v.literal("VERIFY_ONLY")),
    environment: v.optional(v.union(v.literal("DEV"), v.literal("UAT"), v.literal("PROD"))),
    idempotencyKey: v.optional(v.string()),
    tokenRef: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<any> => {
    const startTime = Date.now();
    const requestId = generateRequestId();
    const env = args.environment || "DEV";

    // 1. Server-side Idempotency check (24h cache)
    if (args.idempotencyKey) {
      const cached = await ctx.runQuery(api.telemetry.checkIdempotency, {
        key: args.idempotencyKey,
        clientId: args.clientId,
      });
      if (cached) {
        return cached;
      }
    }

    try {
      // 2. Resolve image payload
      let imageBuffer: Uint8Array;
      let mimeType = "image/jpeg";

      if (args.storageId) {
        const fileBlob = await ctx.storage.get(args.storageId);
        if (!fileBlob) {
          throw new Error("Temporary upload file not found in storage.");
        }
        mimeType = fileBlob.type || "image/jpeg";
        const arrayBuf = await fileBlob.arrayBuffer();
        imageBuffer = new Uint8Array(arrayBuf);

        // Remove temporary raw upload from storage immediately
        try {
          await ctx.storage.delete(args.storageId);
        } catch (cleanupErr) {
          console.warn("Notice: Failed to purge temporary storage file:", cleanupErr);
        }
      } else if (args.imageBase64) {
        const parsed = base64ToUint8Array(args.imageBase64);
        imageBuffer = parsed.buffer;
        mimeType = parsed.mimeType;
      } else {
        throw new Error("MissingImage: Either imageBase64 or storageId must be provided.");
      }

      if (imageBuffer.byteLength < 500) {
        throw new Error("InvalidImage: Face image payload is empty or corrupted.");
      }

      // 3. Resolve tenant settings, policy, and locations
      const dummyEmpId = args.employeeId || "LOOKUP";
      let context: any;
      try {
        context = await ctx.runQuery(internal.attendance.getAttendanceContext, {
          clientId: args.clientId,
          employeeId: dummyEmpId,
        });
      } catch {
        const client = await ctx.runQuery(api.clientAdmin.getClientDetails, {
          clientId: args.clientId,
        });
        if (!client) throw new Error(`Client organization '${args.clientId}' not found.`);

        const locations = await ctx.runQuery(api.clientAdmin.listLocations, {
          clientId: args.clientId,
        });

        context = {
          client: {
            clientId: client.clientId,
            companyName: client.companyName,
            region: client.faceApiRegion || "ka",
            hasApiKey: Boolean(process.env.FACE_API_DEFAULT_KEY),
            resolvedApiKey: process.env.FACE_API_DEFAULT_KEY || "",
          },
          settings: {
            officeStartTime: "09:00",
            officeEndTime: "18:00",
            lateThresholdMinutes: 15,
            timezone: client.timeZone || "Asia/Kolkata",
            geofenceStrictEnforced: false,
            autoCheckoutAtMidnight: true,
            biometricRetentionDays: 365,
            minMatchScore: 80.0,
            maxMatchDistance: 0.35,
          },
          policy: {
            minWorkingHoursStandard: 8,
            halfDayHours: 4,
            overtimeThresholdMinutes: 540,
            requireGeofence: false,
            allowManualCorrection: true,
            maxLateAllowedPerMonth: 3,
          },
          locations: locations.map((l: any) => ({
            locationId: l.locationId,
            name: l.name,
            latitude: l.latitude,
            longitude: l.longitude,
            allowedRadiusMeters: l.allowedRadiusMeters,
            status: l.status,
          })),
        };
      }

      // 4. Geofence & Location Validation
      let locationVerified = false;
      let matchedLocationName = "Unrestricted";
      let distanceMeters = 0;

      if (args.latitude !== undefined && args.longitude !== undefined) {
        const geoCheck = verifyGeofence(
          { latitude: args.latitude, longitude: args.longitude },
          context.locations
        );
        locationVerified = geoCheck.verified;
        matchedLocationName = geoCheck.closestLocationName || "Unknown Location";
        distanceMeters = geoCheck.closestDistanceMeters || 0;

        if (context.settings.geofenceStrictEnforced && !locationVerified) {
          throw new Error(
            `GeofenceViolation: Location is outside approved perimeter (${distanceMeters}m > allowed ${geoCheck.allowedRadiusMeters}m).`
          );
        }
      } else if (context.settings.geofenceStrictEnforced) {
        throw new Error("GeofenceRequired: Client policy requires GPS coordinates for attendance.");
      }

      // 5. Upstream Face API Key resolution
      const apiKey = context.client.resolvedApiKey || process.env.FACE_API_DEFAULT_KEY || "";
      if (!apiKey) {
        throw new Error("UnconfiguredApiKey: Tenant Face API key is missing.");
      }

      // 6. Call upstream Face Recognition API (POST /api/recognize)
      const faceClient = new FaceApiClient(apiKey);
      const recognizeRes = await faceClient.recognizeFace({
        imageBuffer,
        imageContentType: mimeType,
        fileName: "punch_face.jpg",
        region: context.client.region,
      });

      const responseTimeMs = Date.now() - startTime;

      if (!recognizeRes.success || !recognizeRes.matches || recognizeRes.matches.length === 0) {
        const errMsg = recognizeRes.error || "No matching face recognized in the biometric directory.";

        await ctx.runMutation(api.telemetry.recordApiUsage, {
          requestId,
          clientId: args.clientId,
          employeeId: args.employeeId,
          endpoint: "/api/recognize",
          operation: args.actionType,
          environment: env,
          status: "FAILED",
          httpStatus: 404,
          responseTimeMs,
          tokensConsumed: 1,
          tokenRef: args.tokenRef,
        });

        await ctx.runMutation(api.telemetry.recordErrorLog, {
          requestId,
          clientId: args.clientId,
          employeeId: args.employeeId,
          apiName: "FaceApiClient.recognizeFace",
          errorCode: "FACE_NOT_MATCHED",
          errorMessage: errMsg,
          environment: env,
        });

        return {
          success: false,
          verified: false,
          requestId,
          error: errMsg,
          antiSpoofCheck: "UNSUPPORTED_BY_UPSTREAM",
        };
      }

      // 7. Validate Best Match
      const bestMatch = recognizeRes.matches[0];
      const matchScore = bestMatch.match_score;
      const matchDistance = bestMatch.distance;
      const recognizedEmpId = bestMatch.emp_id;

      const minScore = context.settings.minMatchScore || 80.0;
      const maxDistance = context.settings.maxMatchDistance || 0.35;

      if (matchScore < minScore || matchDistance > maxDistance) {
        const errMsg = `ConfidenceBelowThreshold: Match score ${matchScore.toFixed(2)}% below required threshold ${minScore}%.`;
        return {
          success: false,
          verified: false,
          requestId,
          error: errMsg,
          matchScore,
          distance: matchDistance,
          antiSpoofCheck: "UNSUPPORTED_BY_UPSTREAM",
        };
      }

      // 1:1 verification enforcement if specified
      if (args.employeeId && args.employeeId !== recognizedEmpId) {
        const errMsg = `IdentityMismatch: Face matched '${recognizedEmpId}' but requested verification for '${args.employeeId}'.`;
        return {
          success: false,
          verified: false,
          requestId,
          error: errMsg,
          recognizedEmployeeId: recognizedEmpId,
          antiSpoofCheck: "UNSUPPORTED_BY_UPSTREAM",
        };
      }

      // 8. Tenant Boundary Authorization: Verify employee is registered under this specific clientId
      const targetEmpId = recognizedEmpId;
      const verifiedEmployee = await ctx.runQuery(api.clientAdmin.getEmployeeByEmpId, {
        clientId: args.clientId,
        employeeId: targetEmpId,
      });

      if (!verifiedEmployee) {
        throw new Error(
          `TenantIsolationViolation: Matched employee '${targetEmpId}' does not belong to client organization '${args.clientId}'.`
        );
      }

      if (verifiedEmployee.status !== "ACTIVE") {
        throw new Error(`EmployeeInactive: Matched employee '${targetEmpId}' is currently ${verifiedEmployee.status}.`);
      }

      // 9. Execute Attendance Punch or Verification Action
      let attendanceOutcome: any = null;
      let tokensConsumed = 1;

      if (args.actionType === "CHECK_IN") {
        tokensConsumed = 2;
        attendanceOutcome = await ctx.runMutation(internal.attendance.executeCheckIn, {
          clientId: args.clientId,
          employeeId: targetEmpId,
          requestId,
          idempotencyKey: args.idempotencyKey,
          verificationScore: matchScore,
          faceDistance: matchDistance,
          locationVerified,
          locationName: matchedLocationName,
          distanceMeters,
        });
      } else if (args.actionType === "CHECK_OUT") {
        tokensConsumed = 2;
        attendanceOutcome = await ctx.runMutation(internal.attendance.executeCheckOut, {
          clientId: args.clientId,
          employeeId: targetEmpId,
          requestId,
          idempotencyKey: args.idempotencyKey,
          verificationScore: matchScore,
          faceDistance: matchDistance,
          locationVerified,
          locationName: matchedLocationName,
          distanceMeters,
        });
      }

      // 10. Record SaaS Telemetry & Audit
      await ctx.runMutation(api.telemetry.recordApiUsage, {
        requestId,
        clientId: args.clientId,
        employeeId: targetEmpId,
        endpoint: "/api/recognize",
        operation: args.actionType,
        environment: env,
        status: "SUCCESS",
        httpStatus: 200,
        responseTimeMs,
        tokensConsumed,
        tokenRef: args.tokenRef,
      });

      const responsePayload = {
        success: true,
        verified: true,
        requestId,
        actionType: args.actionType,
        employee: {
          employeeId: targetEmpId,
          name: verifiedEmployee.name,
          departmentName: verifiedEmployee.departmentName,
          designation: verifiedEmployee.designation,
        },
        biometrics: {
          matchScore,
          distance: matchDistance,
          antiSpoofCheck: "UNSUPPORTED_BY_UPSTREAM",
          upstreamTotalFaces: recognizeRes.total_faces,
        },
        location: {
          verified: locationVerified,
          locationName: matchedLocationName,
          distanceMeters,
        },
        attendance: attendanceOutcome,
        timestamp: new Date().toISOString(),
      };

      // 11. Save idempotency
      if (args.idempotencyKey) {
        await ctx.runMutation(api.telemetry.saveIdempotency, {
          key: args.idempotencyKey,
          clientId: args.clientId,
          operation: args.actionType,
          response: responsePayload,
        });
      }

      return responsePayload;
    } catch (err: any) {
      const responseTimeMs = Date.now() - startTime;
      const errMsg = err.message || "Face recognition processing encountered an error.";

      await ctx.runMutation(api.telemetry.recordErrorLog, {
        requestId,
        clientId: args.clientId,
        employeeId: args.employeeId,
        apiName: "processFacePunch",
        errorCode: "PUNCH_PROCESSING_ERROR",
        errorMessage: errMsg,
        stackTrace: err.stack,
        environment: env,
      });

      await ctx.runMutation(api.telemetry.recordApiUsage, {
        requestId,
        clientId: args.clientId,
        employeeId: args.employeeId,
        endpoint: "/api/recognize",
        operation: args.actionType,
        environment: env,
        status: "FAILED",
        httpStatus: 500,
        responseTimeMs,
        tokensConsumed: 0,
        tokenRef: args.tokenRef,
      });

      return {
        success: false,
        verified: false,
        requestId,
        error: errMsg,
        antiSpoofCheck: "UNSUPPORTED_BY_UPSTREAM",
      };
    }
  },
});
