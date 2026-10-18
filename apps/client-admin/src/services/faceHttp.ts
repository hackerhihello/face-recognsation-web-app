// Face registration / verification through this app's /api/face proxy, which
// checks the session, takes the tenant from it and forwards to Convex. The
// Face API key never reaches the browser.

import {
  ServiceError,
  type DataService,
  type FaceRegistrationInput,
  type FaceRegistrationResult,
  type FaceVerificationInput,
  type FaceVerificationResult,
  type ServiceErrorCode,
} from "./types";

type Json = Record<string, unknown>;

// The proxy gives Convex 20 s; leave room for the upload itself.
const TIMEOUT_MS = 45000;

const str = (v: unknown) => (typeof v === "string" && v ? v : undefined);
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : undefined);

/** Backend errors look like "BiometricConsentRequired: Explicit …"; keep the human part. */
function cleanMessage(raw: string | undefined, fallback: string) {
  return raw ? raw.replace(/^[A-Z][A-Za-z]+:\s*/, "") : fallback;
}

async function post(path: string, body: Json, idempotencyKey?: string) {
  let res: Response;
  try {
    res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(idempotencyKey && { "Idempotency-Key": idempotencyKey }) },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    const timedOut = err instanceof DOMException && err.name === "TimeoutError";
    throw new ServiceError(
      timedOut
        ? "The face service took too long to respond. Try again; the same photo won't be registered twice."
        : "Couldn't reach the server. Check your connection and try again.",
      "UNAVAILABLE",
    );
  }
  const data = ((await res.json().catch(() => null)) ?? {}) as Json;
  return { res, data };
}

function toError(res: Response, data: Json): ServiceError {
  const requestId = str(data.requestId);
  const message = str(data.error);
  const byStatus: Record<number, [ServiceErrorCode, string]> = {
    401: ["FORBIDDEN", "Your session has expired. Sign in again."],
    403: ["FORBIDDEN", "You don't have permission for this action."],
    404: ["NOT_FOUND", "The face service endpoint was not found."],
    429: ["UNAVAILABLE", "Too many requests to the face service. Wait a moment and try again."],
  };
  const [code, fallback] =
    byStatus[res.status] ??
    (res.status >= 500 ? ["UNAVAILABLE", "The face service is unavailable. Try again later."] : ["VALIDATION", "The face service rejected this photo."]);
  // 5xx messages from upstream can be internal; prefer our own wording unless the proxy wrote it.
  const useMessage = res.status < 500 || res.status === 502 || res.status === 503;
  return new ServiceError(useMessage ? cleanMessage(message, fallback) : fallback, code, requestId);
}

export const httpFaceService: Pick<DataService, "registerFace" | "verifyFace"> = {
  async registerFace(input: FaceRegistrationInput): Promise<FaceRegistrationResult> {
    const { res, data } = await post(
      "/api/face/register",
      { employeeId: input.employeeId, imageBase64: input.imageDataUrl, consentConfirmed: input.consentConfirmed },
      input.idempotencyKey,
    );
    if (!res.ok || data.success !== true) throw toError(res, data);
    const faceId = str(data.faceId);
    if (!faceId) throw new ServiceError("The face service returned an incomplete response.", "UNKNOWN", str(data.requestId));
    return {
      employeeId: str(data.employeeId) ?? input.employeeId,
      faceId,
      faceEncodingId: num(data.faceEncodingId),
      facesDetected: num(data.facesDetected),
      registeredAt: str(data.registeredAt) ?? new Date().toISOString(),
      requestId: str(data.requestId),
    };
  },

  async verifyFace(input: FaceVerificationInput): Promise<FaceVerificationResult> {
    const { res, data } = await post("/api/face/verify", { employeeId: input.employeeId, imageBase64: input.imageDataUrl });
    const biometrics = (data.biometrics ?? {}) as Json;
    if (res.ok && data.success === true && data.verified === true) {
      return {
        verified: true,
        message: "Face matched this employee.",
        matchScore: num(biometrics.matchScore),
        distance: num(biometrics.distance),
        requestId: str(data.requestId),
      };
    }
    // A completed check that didn't match is a result, not a failure.
    if (res.status === 400 && data.verified === false && str(data.requestId)) {
      return {
        verified: false,
        message: cleanMessage(str(data.error), "The face did not match this employee."),
        matchScore: num(data.matchScore),
        distance: num(data.distance),
        recognizedEmployeeId: str(data.recognizedEmployeeId),
        requestId: str(data.requestId),
      };
    }
    throw toError(res, data);
  },
};
