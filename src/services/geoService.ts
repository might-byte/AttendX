/**
 * Geolocation & Geofencing Service with Haversine distance,
 * accuracy checks, and anti-spoofing anomaly detection.
 */

export interface GeoPosition {
  lat: number;
  lng: number;
  accuracy: number; // meters
}

export interface GeofenceResult {
  isInside: boolean;
  distanceMeters: number;
  accuracy: number;
  isAccuracyAcceptable: boolean;
  warning?: string;
}

/**
 * Calculates distance in meters between two lat/lng pairs using the Haversine formula.
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Gets high accuracy GPS coordinates from the device
 */
export async function getCurrentCoordinates(): Promise<GeoPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: Math.round(position.coords.accuracy),
        });
      },
      (error) => {
        let msg = 'Failed to obtain GPS location.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            msg = 'Location permission was denied. Please allow location access to mark attendance.';
            break;
          case error.POSITION_UNAVAILABLE:
            msg = 'Location information is unavailable. Ensure GPS is enabled.';
            break;
          case error.TIMEOUT:
            msg = 'Location request timed out. Please check signal and retry.';
            break;
        }
        reject(new Error(msg));
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      }
    );
  });
}

/**
 * Validates if coordinates are inside the classroom geofence
 */
export function checkGeofence(
  currentPos: GeoPosition,
  targetLat: number,
  targetLng: number,
  targetRadiusMeters: number
): GeofenceResult {
  const distance = calculateHaversineDistance(
    currentPos.lat,
    currentPos.lng,
    targetLat,
    targetLng
  );

  // Indoor GPS often fluctuates by 20-50m.
  // Standard policy: allowable distance = radius + up to half of GPS accuracy margin (max 40m relaxation)
  const accuracyMargin = Math.min(Math.round(currentPos.accuracy * 0.5), 40);
  const effectiveAllowedDistance = targetRadiusMeters + accuracyMargin;

  const isInside = distance <= effectiveAllowedDistance;
  const isAccuracyAcceptable = currentPos.accuracy <= 150; // Warn if > 150m

  let warning: string | undefined;
  if (!isAccuracyAcceptable) {
    warning = `GPS accuracy is poor (±${currentPos.accuracy}m). Move near a window or open door for stronger satellite reception.`;
  } else if (!isInside) {
    warning = `You are ${distance}m away from the classroom. Must be within ${targetRadiusMeters}m.`;
  }

  return {
    isInside,
    distanceMeters: distance,
    accuracy: currentPos.accuracy,
    isAccuracyAcceptable,
    warning,
  };
}

/**
 * Anomaly check: duplicate exact coordinates across different students in the same session
 * (indicates potential coordinate cloning or proxy marking)
 */
export function isDuplicateCoordinates(
  pos: GeoPosition,
  existingRecords: Array<{ studentId: string; lat?: number; lng?: number }>,
  currentStudentId: string
): boolean {
  return existingRecords.some((rec) => {
    if (rec.studentId === currentStudentId || !rec.lat || !rec.lng) return false;
    // Check if matching within 0.000005 degrees (~0.5 meter precision)
    const latDiff = Math.abs(rec.lat - pos.lat);
    const lngDiff = Math.abs(rec.lng - pos.lng);
    return latDiff < 0.000005 && lngDiff < 0.000005;
  });
}
