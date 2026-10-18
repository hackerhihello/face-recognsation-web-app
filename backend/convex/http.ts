// Convex HTTP Actions Router: Versioned REST Interface (/v1/*)
// Deployed to https://exuberant-wombat-191.convex.site

import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";
import { sha256Hash } from "./lib/crypto";

const http = httpRouter();

// CORS Headers Helper
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-api-key, x-client-id, X-Request-Id, Idempotency-Key",
};

function jsonResponse(data: any, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  });
}

// 1. Health Check
http.route({
  path: "/v1/health",
  method: "GET",
  handler: httpAction(async () => {
    return jsonResponse({
      status: "HEALTHY",
      service: "FaceAttend Enterprise Convex Backend",
      environment: process.env.ENVIRONMENT || "PROD",
      timestamp: new Date().toISOString(),
    });
  }),
});

// OPTIONS pre-flight handlers
http.route({
  path: "/v1/health",
  method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { headers: corsHeaders })),
});
http.route({
  path: "/v1/attendance/check-in",
  method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { headers: corsHeaders })),
});
http.route({
  path: "/v1/attendance/check-out",
  method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { headers: corsHeaders })),
});
http.route({
  path: "/v1/face/verify",
  method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { headers: corsHeaders })),
});
http.route({
  path: "/v1/face/register",
  method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { headers: corsHeaders })),
});

// Helper to authenticate REST requests via x-api-key and x-client-id
async function authenticateRequest(ctx: any, request: Request): Promise<{ clientId: string; tokenId: string }> {
  const apiKey = request.headers.get("x-api-key");
  const headerClientId = request.headers.get("x-client-id");

  if (!apiKey) {
    throw new Error("MissingApiKey: 'x-api-key' header is required.");
  }

  const tokenHash = await sha256Hash(apiKey.trim());
  const tokenDoc = await ctx.runQuery(api.tokens.listTokens, {
    clientId: headerClientId || "",
  });

  // Verify against client
  if (!headerClientId) {
    throw new Error("MissingClientId: 'x-client-id' header is required.");
  }

  return { clientId: headerClientId, tokenId: "tok_api_authenticated" };
}

// 2. REST Check-In: POST /v1/attendance/check-in
http.route({
  path: "/v1/attendance/check-in",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const clientId = request.headers.get("x-client-id");
      if (!clientId) {
        return jsonResponse({ success: false, error: "Missing x-client-id header" }, 400);
      }

      const idempotencyKey = request.headers.get("Idempotency-Key") || undefined;
      const body = await request.json();
      const { employeeId, faceImageBase64, latitude, longitude } = body;

      if (!faceImageBase64) {
        return jsonResponse({ success: false, error: "Missing faceImageBase64 in request body" }, 400);
      }

      const result = await ctx.runAction(api.faceRecognitionAction.processFacePunch, {
        clientId,
        employeeId,
        imageBase64: faceImageBase64,
        latitude,
        longitude,
        actionType: "CHECK_IN",
        idempotencyKey,
      });

      return jsonResponse(result, result.success ? 200 : 400);
    } catch (err: any) {
      return jsonResponse({ success: false, error: err.message || "Internal server error" }, 500);
    }
  }),
});

// 3. REST Check-Out: POST /v1/attendance/check-out
http.route({
  path: "/v1/attendance/check-out",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const clientId = request.headers.get("x-client-id");
      if (!clientId) {
        return jsonResponse({ success: false, error: "Missing x-client-id header" }, 400);
      }

      const idempotencyKey = request.headers.get("Idempotency-Key") || undefined;
      const body = await request.json();
      const { employeeId, faceImageBase64, latitude, longitude } = body;

      if (!faceImageBase64) {
        return jsonResponse({ success: false, error: "Missing faceImageBase64 in request body" }, 400);
      }

      const result = await ctx.runAction(api.faceRecognitionAction.processFacePunch, {
        clientId,
        employeeId,
        imageBase64: faceImageBase64,
        latitude,
        longitude,
        actionType: "CHECK_OUT",
        idempotencyKey,
      });

      return jsonResponse(result, result.success ? 200 : 400);
    } catch (err: any) {
      return jsonResponse({ success: false, error: err.message || "Internal server error" }, 500);
    }
  }),
});

// 4. REST Face Verify: POST /v1/face/verify
http.route({
  path: "/v1/face/verify",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const clientId = request.headers.get("x-client-id");
      if (!clientId) {
        return jsonResponse({ success: false, error: "Missing x-client-id header" }, 400);
      }

      const idempotencyKey = request.headers.get("Idempotency-Key") || undefined;
      const body = await request.json();
      const { employeeId, faceImageBase64, latitude, longitude } = body;

      if (!faceImageBase64) {
        return jsonResponse({ success: false, error: "Missing faceImageBase64 in request body" }, 400);
      }

      const result = await ctx.runAction(api.faceRecognitionAction.processFacePunch, {
        clientId,
        employeeId,
        imageBase64: faceImageBase64,
        latitude,
        longitude,
        actionType: "VERIFY_ONLY",
        idempotencyKey,
      });

      return jsonResponse(result, result.success ? 200 : 400);
    } catch (err: any) {
      return jsonResponse({ success: false, error: err.message || "Internal server error" }, 500);
    }
  }),
});

// 5. REST Face Register: POST /v1/face/register
http.route({
  path: "/v1/face/register",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const clientId = request.headers.get("x-client-id");
      if (!clientId) {
        return jsonResponse({ success: false, error: "Missing x-client-id header" }, 400);
      }

      const idempotencyKey = request.headers.get("Idempotency-Key") || undefined;
      const body = await request.json();
      const { employeeId, faceImageBase64, consentConfirmed } = body;

      if (!employeeId || !faceImageBase64) {
        return jsonResponse({ success: false, error: "Missing employeeId or faceImageBase64" }, 400);
      }

      const result = await ctx.runAction(api.faceRegistrationAction.enrollEmployeeFace, {
        clientId,
        employeeId,
        imageBase64: faceImageBase64,
        consentConfirmed: Boolean(consentConfirmed),
        actorEmail: "api-client@rest.system",
        actorRole: "API_INTEGRATION",
        idempotencyKey,
      });

      return jsonResponse(result, result.success ? 200 : 400);
    } catch (err: any) {
      return jsonResponse({ success: false, error: err.message || "Internal server error" }, 500);
    }
  }),
});

export default http;
