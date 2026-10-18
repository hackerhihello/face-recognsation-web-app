// GPS Geofence Haversine Verification Engine

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface GeofenceLocation {
  locationId: string;
  name: string;
  latitude: number;
  longitude: number;
  allowedRadiusMeters: number;
  status: "ACTIVE" | "INACTIVE";
}

export interface GeofenceResult {
  verified: boolean;
  closestLocationName?: string;
  closestDistanceMeters?: number;
  allowedRadiusMeters?: number;
  matchedLocationId?: string;
}

/**
 * Calculates great-circle distance between two GPS coordinates using the Haversine formula.
 * Returns distance in meters.
 */
export function calculateHaversineDistanceMeters(
  coord1: Coordinates,
  coord2: Coordinates
): number {
  const EARTH_RADIUS_METERS = 6371000;

  const toRadians = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRadians(coord2.latitude - coord1.latitude);
  const dLon = toRadians(coord2.longitude - coord1.longitude);

  const lat1 = toRadians(coord1.latitude);
  const lat2 = toRadians(coord2.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(EARTH_RADIUS_METERS * c * 100) / 100;
}

/**
 * Validates employee punch coordinates against client's active approved locations.
 */
export function verifyGeofence(
  punchCoord: Coordinates,
  approvedLocations: GeofenceLocation[]
): GeofenceResult {
  const activeLocations = approvedLocations.filter((loc) => loc.status === "ACTIVE");

  if (activeLocations.length === 0) {
    // If no geofences defined for client, consider passed with unconstrained radius
    return {
      verified: true,
      closestLocationName: "Default Office",
      closestDistanceMeters: 0,
      allowedRadiusMeters: 500,
    };
  }

  let minDistance = Infinity;
  let closestLoc: GeofenceLocation | null = null;

  for (const loc of activeLocations) {
    const dist = calculateHaversineDistanceMeters(punchCoord, {
      latitude: loc.latitude,
      longitude: loc.longitude,
    });

    if (dist < minDistance) {
      minDistance = dist;
      closestLoc = loc;
    }
  }

  if (!closestLoc) {
    return { verified: false };
  }

  const isInside = minDistance <= closestLoc.allowedRadiusMeters;

  return {
    verified: isInside,
    closestLocationName: closestLoc.name,
    closestDistanceMeters: minDistance,
    allowedRadiusMeters: closestLoc.allowedRadiusMeters,
    matchedLocationId: closestLoc.locationId,
  };
}
