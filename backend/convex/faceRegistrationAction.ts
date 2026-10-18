"use node";

// Convex Server-Side Action: Face Registration / Enrollment
// Directly integrates with POST /api/enroll on https://api.kalaburagitech.com

import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { FaceApiClient, base64ToUint8Array } from "./lib/faceApiClient";
import { generateRequestId } from "./lib/requestId";

export const enrollEmployeeFace = action({
  args: {
    clientId: v.string(),
    employeeId: v.string(),
    imageBase64: v.optional(v.string()),
    storageId: v.optional(v.id("_storage")),
    consentConfirmed: v.boolean(),
    actorEmail: v.string(),
    actorRole: v.string(),
    environment: v.optional(v.union(v.literal("DEV"), v.literal("UAT"), v.literal("PROD"))),
    idempotencyKey: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<any> => {
    const startTime = Date.now();
    const requestId = generateRequestId();
    const env = args.environment || "DEV";

    // 1. Check idempotency if key supplied
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
      // 2. Validate employee and client context from database
      const context = await ctx.runQuery(
        api.internalFaceRegistration.getEnrollmentContext,
        {
          clientId: args.clientId,
          employeeId: args.employeeId,
        }
      );

      // 3. Biometric consent check
      if (!args.consentConfirmed && !context.employee.biometricConsentGiven) {
        throw new Error(
          "BiometricConsentRequired: Explicit employee consent is required before face registration."
        );
      }

      // 4. Resolve image data
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

        // Security rule: purge temporary raw image from Convex storage immediately
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
        throw new Error("InvalidImage: Uploaded face image payload is too small or empty.");
      }

      // 5. Upstream Face API Key resolution
      if (!context.client.resolvedApiKey) {
        throw new Error(
          "UnconfiguredApiKey: Tenant Face API key is missing. Configure tenant API credentials or FACE_API_DEFAULT_KEY."
        );
      }

      // 6. Call upstream Face API
      const client = new FaceApiClient(context.client.resolvedApiKey);
      const enrollRes = await client.enrollPerson({
        imageBuffer,
        imageContentType: mimeType,
        fileName: `${args.employeeId}_face.jpg`,
        empId: context.employee.employeeId,
        name: context.employee.name,
        region: context.client.region,
        empRank: context.employee.empRank,
      });

      const responseTimeMs = Date.now() - startTime;

      if (!enrollRes.success || !enrollRes.face_encoding_id) {
        const errMsg = enrollRes.error || "Upstream Face API enrollment failed";

        // Log failed telemetry & error
        await ctx.runMutation(api.telemetry.recordApiUsage, {
          requestId,
          clientId: args.clientId,
          employeeId: args.employeeId,
          endpoint: "/api/enroll",
          operation: "FACE_REGISTRATION",
          environment: env,
          status: "FAILED",
          httpStatus: 400,
          responseTimeMs,
          tokensConsumed: 0,
        });

        await ctx.runMutation(api.telemetry.recordErrorLog, {
          requestId,
          clientId: args.clientId,
          employeeId: args.employeeId,
          apiName: "FaceApiClient.enrollPerson",
          errorCode: "UPSTREAM_ENROLL_FAILED",
          errorMessage: errMsg,
          environment: env,
        });

        return {
          success: false,
          requestId,
          error: errMsg,
        };
      }

      // 7. Complete enrollment in database
      const dbResult = await ctx.runMutation(
        api.internalFaceRegistration.completeEnrollment,
        {
          clientId: args.clientId,
          employeeId: args.employeeId,
          faceEncodingId: enrollRes.face_encoding_id,
          facesDetected: enrollRes.faces_detected || 1,
          processingTime: enrollRes.processing_time || 0,
          registeredBy: args.actorEmail,
          requestId,
          consentConfirmed: true,
        }
      );

      // 8. Log successful telemetry & audit
      await ctx.runMutation(api.telemetry.recordApiUsage, {
        requestId,
        clientId: args.clientId,
        employeeId: args.employeeId,
        endpoint: "/api/enroll",
        operation: "FACE_REGISTRATION",
        environment: env,
        status: "SUCCESS",
        httpStatus: 200,
        responseTimeMs,
        tokensConsumed: 5, // 5 units consumed per spec
      });

      await ctx.runMutation(api.telemetry.recordAuditLog, {
        requestId,
        clientId: args.clientId,
        actorEmail: args.actorEmail,
        actorRole: args.actorRole,
        action: "FACE_REGISTRATION_COMPLETED",
        targetResource: `employee:${args.employeeId}`,
        outcome: "SUCCESS",
        metadata: {
          faceId: dbResult.faceId,
          faceEncodingId: enrollRes.face_encoding_id,
          facesDetected: enrollRes.faces_detected,
        },
      });

      const responsePayload = {
        success: true,
        requestId,
        employeeId: args.employeeId,
        name: context.employee.name,
        faceId: dbResult.faceId,
        faceEncodingId: enrollRes.face_encoding_id,
        facesDetected: enrollRes.faces_detected || 1,
        processingTime: enrollRes.processing_time,
        registeredAt: new Date().toISOString(),
      };

      // 9. Cache idempotency if requested
      if (args.idempotencyKey) {
        await ctx.runMutation(api.telemetry.saveIdempotency, {
          key: args.idempotencyKey,
          clientId: args.clientId,
          operation: "FACE_REGISTRATION",
          response: responsePayload,
        });
      }

      return responsePayload;
    } catch (err: any) {
      const responseTimeMs = Date.now() - startTime;
      const errMsg = err.message || "An unexpected error occurred during face registration.";

      await ctx.runMutation(api.telemetry.recordErrorLog, {
        requestId,
        clientId: args.clientId,
        employeeId: args.employeeId,
        apiName: "enrollEmployeeFace",
        errorCode: "REGISTRATION_EXCEPTION",
        errorMessage: errMsg,
        stackTrace: err.stack,
        environment: env,
      });

      await ctx.runMutation(api.telemetry.recordApiUsage, {
        requestId,
        clientId: args.clientId,
        employeeId: args.employeeId,
        endpoint: "/api/enroll",
        operation: "FACE_REGISTRATION",
        environment: env,
        status: "FAILED",
        httpStatus: 500,
        responseTimeMs,
        tokensConsumed: 0,
      });

      return {
        success: false,
        requestId,
        error: errMsg,
      };
    }
  },
});
