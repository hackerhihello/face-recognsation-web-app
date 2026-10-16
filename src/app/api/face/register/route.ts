import { forwardFaceRequest } from "../proxy";

// Body: { employeeId, imageBase64, consentConfirmed: true }
// Forwards to Convex POST /v1/face/register → Face API POST /api/enroll.
export async function POST(req: Request) {
  return forwardFaceRequest(req, "/v1/face/register", "faces.register", (input) => {
    const image = input.imageBase64 ?? input.faceImageBase64;
    if (typeof input.employeeId !== "string" || !input.employeeId) return "employeeId is required.";
    if (typeof image !== "string" || !image) return "imageBase64 is required.";
    // Consent must be explicit; it is never assumed.
    if (input.consentConfirmed !== true) return "Biometric consent must be confirmed before registration.";
    return { employeeId: input.employeeId, faceImageBase64: image, consentConfirmed: true };
  });
}
