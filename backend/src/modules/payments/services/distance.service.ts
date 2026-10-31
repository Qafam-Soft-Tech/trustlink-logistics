import { Injectable } from '@nestjs/common';

export const SERVICE_AREA_COORDS: Record<string, { lat: number; lng: number }> = {
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

export const DEFAULT_DISTANCE_KM = 5;
export const SAME_AREA_DISTANCE_KM = 2.5;

export interface DistanceInput {
  pickupArea?: string | null;
  dropoffArea?: string | null;
  pickupLatitude?: number | null;
  pickupLongitude?: number | null;
  dropoffLatitude?: number | null;
  dropoffLongitude?: number | null;
  distanceKm?: number | null;
}

@Injectable()
export class DistanceService {
  resolve(input: DistanceInput): number {
    if (this.hasCoordinates(input.pickupLatitude, input.pickupLongitude) &&
        this.hasCoordinates(input.dropoffLatitude, input.dropoffLongitude)) {
      const distance = this.haversine(
        { lat: input.pickupLatitude!, lng: input.pickupLongitude! },
        { lat: input.dropoffLatitude!, lng: input.dropoffLongitude! },
      );
      return Math.max(0.5, distance);
    }

    if (input.pickupArea && input.dropoffArea) {
      const pickup = SERVICE_AREA_COORDS[input.pickupArea];
      const dropoff = SERVICE_AREA_COORDS[input.dropoffArea];
      if (pickup && dropoff) {
        if (input.pickupArea === input.dropoffArea) return SAME_AREA_DISTANCE_KM;
        return Math.max(0.5, this.haversine(pickup, dropoff));
      }
    }

    if (input.distanceKm != null && Number.isFinite(input.distanceKm)) {
      return Math.max(0, Number(input.distanceKm));
    }

    return DEFAULT_DISTANCE_KM;
  }

  private hasCoordinates(lat?: number | null, lng?: number | null): boolean {
    return typeof lat === 'number' && typeof lng === 'number' && !(lat === 0 && lng === 0);
  }

  private haversine(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
    const R = 6371;
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLng = ((b.lng - a.lng) * Math.PI) / 180;
    const s =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    return Math.round(R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s)) * 10) / 10;
  }
}
