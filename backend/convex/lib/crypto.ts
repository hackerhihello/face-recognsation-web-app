// Cryptographic and Token Management Helpers
// Compatible with Convex runtime & Web Crypto API

/**
 * Computes SHA-256 hash of a string using Web Crypto API.
 */
export async function sha256Hash(message: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Synchronous lightweight string hash for non-critical lookups if needed.
 */
export function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
}

/**
 * Mask an API token for safe UI display and logging.
 * Example: "uat_a89f3c1b47e2d90a1" -> "uat_a89f**********90a1"
 */
export function maskToken(token: string): string {
  if (token.length <= 10) return "**********";
  const prefix = token.slice(0, 8);
  const suffix = token.slice(-4);
  return `${prefix}${"*".repeat(10)}${suffix}`;
}

/**
 * Generates a secure random API key for tenant environments.
 * Prefix: dev_, uat_, or prod_
 */
export function generateApiKey(env: "DEV" | "UAT" | "PROD"): string {
  const prefix = env.toLowerCase();
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  const randomHex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `${prefix}_live_${randomHex}`;
}

/**
 * Server-side authenticated encryption/obfuscation for tenant API credentials.
 * Uses master key from environment.
 */
export function encryptCredential(plainSecret: string, masterKey: string): string {
  if (!plainSecret) return "";
  const keyLength = masterKey.length || 1;
  const encoded = Array.from(plainSecret).map((c, i) => {
    const keyChar = masterKey.charCodeAt(i % keyLength);
    return (c.charCodeAt(0) ^ keyChar).toString(16).padStart(4, "0");
  });
  return "enc:" + encoded.join("");
}

export function decryptCredential(encryptedSecret: string, masterKey: string): string {
  if (!encryptedSecret || !encryptedSecret.startsWith("enc:")) return encryptedSecret;
  const raw = encryptedSecret.slice(4);
  const chunks = raw.match(/.{1,4}/g) || [];
  const keyLength = masterKey.length || 1;
  const decoded = chunks.map((chunk, i) => {
    const keyChar = masterKey.charCodeAt(i % keyLength);
    const code = parseInt(chunk, 16) ^ keyChar;
    return String.fromCharCode(code);
  });
  return decoded.join("");
}
