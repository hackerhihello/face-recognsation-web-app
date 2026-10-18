// Standard Request ID Generator and Tracer
// Format: REQ-YYYYMMDD-XXXXXX

export function generateRequestId(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `REQ-${year}${month}${day}-${randomHex}`;
}

export function parseRequestIdDate(requestId: string): string | null {
  const match = requestId.match(/^REQ-(\d{4})(\d{2})(\d{2})-/);
  if (!match) return null;
  return `${match[1]}-${match[2]}-${match[3]}`;
}
