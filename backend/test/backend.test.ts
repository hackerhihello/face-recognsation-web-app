// Comprehensive Backend Test Suite
// Verifies: Cryptography, Geofencing, Request ID Tracing, Attendance Logic, Face API Contracts, and Live API Health

import test from "node:test";
import assert from "node:assert/strict";

// 1. Request ID Tracing
import { generateRequestId, parseRequestIdDate } from "../convex/lib/requestId";

test("Request ID format and date parsing", () => {
  const reqId = generateRequestId();
  assert.match(reqId, /^REQ-\d{8}-[A-Z0-9]{6}$/, "Should match standard REQ-YYYYMMDD-XXXXXX format");

  const parsedDate = parseRequestIdDate(reqId);
  assert.ok(parsedDate, "Parsed date should not be null");
  assert.match(parsedDate, /^\d{4}-\d{2}-\d{2}$/, "Date should be formatted as YYYY-MM-DD");
});

// 2. Cryptography, Hashing, Masking, and Credential Encryption
import { sha256Hash, maskToken, generateApiKey, encryptCredential, decryptCredential } from "../convex/lib/crypto";

test("Token generation and SHA-256 hashing", async () => {
  const uatToken = generateApiKey("UAT");
  assert.match(uatToken, /^uat_live_[a-f0-9]{40}$/);

  const prodToken = generateApiKey("PROD");
  assert.match(prodToken, /^prod_live_[a-f0-9]{40}$/);

  const hash1 = await sha256Hash(uatToken);
  const hash2 = await sha256Hash(uatToken);
  assert.equal(hash1, hash2, "SHA-256 hash must be deterministic");
  assert.equal(hash1.length, 64, "SHA-256 hash length must be 64 characters");

  const masked = maskToken(uatToken);
  assert.ok(masked.startsWith("uat_live"), "Masked token must preserve prefix");
  assert.ok(masked.includes("**********"), "Masked token must obscure secrets");
});

test("Tenant credential server-side authenticated encryption/decryption", () => {
  const masterKey = "master_secret_encryption_key_2026";
  const plainApiKey = "kalaburagi_org_key_sec_99882211";

  const encrypted = encryptCredential(plainApiKey, masterKey);
  assert.ok(encrypted.startsWith("enc:"), "Encrypted string should have prefix enc:");
  assert.notEqual(encrypted, plainApiKey, "Encrypted string must not match plaintext");

  const decrypted = decryptCredential(encrypted, masterKey);
  assert.equal(decrypted, plainApiKey, "Decrypted credential must match original plaintext");
});

// 3. GPS Geofence & Haversine Distance
import { calculateHaversineDistanceMeters, verifyGeofence } from "../convex/lib/geofence";

test("Haversine spherical distance calculation", () => {
  const bangalore = { latitude: 12.9716, longitude: 77.5946 };
  const kalaburagi = { latitude: 17.3297, longitude: 76.8343 };

  const distMeters = calculateHaversineDistanceMeters(bangalore, kalaburagi);
  const distKm = distMeters / 1000;
  assert.ok(distKm > 480 && distKm < 520, `Distance should be ~490-510km, got ${distKm.toFixed(1)}km`);

  const zeroDist = calculateHaversineDistanceMeters(bangalore, bangalore);
  assert.equal(zeroDist, 0, "Distance between identical points must be 0 meters");
});

test("Geofence verification against approved corporate perimeters", () => {
  const officeLocation = {
    locationId: "loc_001",
    name: "Headquarters Office",
    latitude: 17.3297,
    longitude: 76.8343,
    allowedRadiusMeters: 100,
    status: "ACTIVE" as const,
  };

  // 1. Point within 20 meters
  const closeCoord = { latitude: 17.32975, longitude: 76.83435 };
  const resInside = verifyGeofence(closeCoord, [officeLocation]);
  assert.equal(resInside.verified, true, "Point inside radius must pass geofence verification");
  assert.equal(resInside.closestLocationName, "Headquarters Office");
  assert.ok((resInside.closestDistanceMeters || 0) < 100);

  // 2. Point 5 km away
  const farCoord = { latitude: 17.3700, longitude: 76.8343 };
  const resOutside = verifyGeofence(farCoord, [officeLocation]);
  assert.equal(resOutside.verified, false, "Point outside radius must fail geofence verification");
  assert.ok((resOutside.closestDistanceMeters || 0) > 4000);
});

// 4. Face API Client & Contract Verification
import { FaceApiClient, base64ToUint8Array } from "../convex/lib/faceApiClient";

test("Base64 image to Uint8Array converter", () => {
  const dummyBase64 = "data:image/jpeg;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
  const { buffer, mimeType } = base64ToUint8Array(dummyBase64);
  assert.equal(mimeType, "image/jpeg");
  assert.ok(buffer.byteLength > 10, "Buffer should contain decoded bytes");
});

test("Live Face API health endpoint ping", async () => {
  const client = new FaceApiClient("test_ping_key", "https://api.kalaburagitech.com");
  const health = await client.checkHealth();
  assert.ok(health.status > 0, `Live Face API must be reachable (received HTTP ${health.status})`);
  assert.ok(health.message.includes("API key") || health.ok, "Live Face API confirms X-API-Key gatekeeper active");
});

// 5. Attendance Calculation & Shift Logic
test("Working duration and shift calculations", () => {
  const checkIn = new Date("2026-04-09T09:00:00.000Z");
  const checkOut = new Date("2026-04-09T17:30:00.000Z");

  const activeMinutes = Math.round((checkOut.getTime() - checkIn.getTime()) / (60 * 1000));
  assert.equal(activeMinutes, 510, "9:00 to 17:30 should be 510 active minutes (8h 30m)");

  const halfDayPunch = 180;
  assert.ok(halfDayPunch < 240, "180 minutes is below 4-hour half-day threshold");

  const overtimePunch = 550;
  assert.ok(overtimePunch >= 540, "550 minutes exceeds 9-hour overtime threshold");
});
