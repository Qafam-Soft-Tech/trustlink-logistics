/**
 * Service-area geography — pure TS.
 * Approximate coordinates → deterministic area-pair distance estimate (km).
 * R1 is status-based with no map provider, so this client-side estimate feeds
 * `POST /pricing/calculate` (ledger SC-8).
 */
import { SERVICE_AREAS, type ServiceArea } from './constants';

export const SERVICE_AREA_COORDS: Record<ServiceArea, { lat: number; lng: number }> = {
  'Wuse 2': { lat: 9.077, lng: 7.479 },
  Maitama: { lat: 9.088, lng: 7.495 },
  Garki: { lat: 9.035, lng: 7.49 },
  Jabi: { lat: 9.068, lng: 7.42 },
  Utako: { lat: 9.063, lng: 7.445 },
  Gwarinpa: { lat: 9.105, lng: 7.4 },
  Kubwa: { lat: 9.155, lng: 7.33 },
  Lugbe: { lat: 8.97, lng: 7.37 },
  Asokoro: { lat: 9.04, lng: 7.525 },
  CBD: { lat: 9.057, lng: 7.495 },
};

/** Fallback distance (km) when an area is unknown / outside the launch zone. */
export const DEFAULT_DISTANCE_KM = 5;
/** Same-area distance (km) — a minimum local trip, not zero. */
export const SAME_AREA_DISTANCE_KM = 2.5;

export function isServiceArea(value?: string | null): value is ServiceArea {
  return Boolean(value) && (SERVICE_AREAS as readonly string[]).includes(value as string);
}

function haversine(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s)) * 10) / 10;
}

/** Deterministic distance estimate (km) between two launch areas. */
export function estimateDistanceKm(pickupArea?: string | null, dropoffArea?: string | null): number {
  if (!isServiceArea(pickupArea) || !isServiceArea(dropoffArea)) return DEFAULT_DISTANCE_KM;
  if (pickupArea === dropoffArea) return SAME_AREA_DISTANCE_KM;
  return haversine(SERVICE_AREA_COORDS[pickupArea], SERVICE_AREA_COORDS[dropoffArea]);
}

/** Rough ETA copy for a distance (no routing engine in R1). */
export function estimateEtaMinutes(distanceKm: number): number {
  return Math.max(15, Math.round(distanceKm * 4));
}
