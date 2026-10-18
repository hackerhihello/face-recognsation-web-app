import { forwardFaceRequest } from "../proxy";

// Body: { employeeId?, imageBase64, latitude?, longitude? }
// Forwards to Convex POST /v1/face/verify → Face API POST /api/recognize.
export async function POST(req: Request) {
  return forwardFaceRequest(req, "/v1/face/verify", "attendance.view", (input) => {
    const image = input.imageBase64 ?? input.faceImageBase64;
    if (typeof image !== "string" || !image) return "imageBase64 is required.";
    const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : undefined);
    return {
      employeeId: typeof input.employeeId === "string" && input.employeeId ? input.employeeId : undefined,
      faceImageBase64: image,
      latitude: num(input.latitude),
      longitude: num(input.longitude),
    };
  });
}
