/**
 * Deterministic demo fixtures — realistic Nigerian / Abuja data.
 * Pure TS. Naira only. Tracking numbers TLK-2026-0xx.
 */
import type {
  Address,
  Delivery,
  DeliveryEvent,
  DeliveryStatus,
  Issue,
  Notification,
  PackageType,
  RiderProfile,
  User,
  VehicleType,
} from '../domain/types';
import { DEFAULT_PRICING, calculateFare } from '../domain/fare';

export const RECIPIENT_CODE = '482913';

/** Abuja areas (R1 launch city). */
export const ABUJA_AREAS = [
  'Wuse 2',
  'Maitama',
  'Garki',
  'Jabi',
  'Utako',
  'Gwarinpa',
  'Kubwa',
  'Lugbe',
  'Asokoro',
  'CBD',
] as const;
export type AbujaArea = (typeof ABUJA_AREAS)[number];

/** Approximate coordinates → deterministic area-pair distance table. */
export const AREA_COORDS: Record<AbujaArea, { lat: number; lng: number }> = {
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

function haversine(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s)) * 10) / 10;
}

/** Deterministic distance (km) between two Abuja areas. */
export function distanceBetween(a: AbujaArea, b: AbujaArea): number {
  if (a === b) return 2.5;
  return haversine(AREA_COORDS[a], AREA_COORDS[b]);
}

export const PRICING_FIXTURE = { ...DEFAULT_PRICING };

export const DEMO_CUSTOMER: User = {
  id: 'cust-amina',
  phone: '08031234567',
  email: 'amina.bello@example.com',
  firstName: 'Amina',
  lastName: 'Bello',
  role: 'customer',
  kycStatus: 'approved',
  isActive: true,
  isPhoneVerified: true,
  createdAt: '2026-01-04T08:00:00.000Z',
};

export const DEMO_ADDRESSES: Address[] = [
  mkAddress('addr-1', 'Home', '12 Aminu Kano Crescent', 'Near Sahad Stores', 'Wuse 2', true),
  mkAddress('addr-2', 'Office', 'Plot 447 Constitution Avenue', 'Central Business District', 'CBD', false),
  mkAddress('addr-3', "Mum's place", '5 Moshood Abiola Way', 'Beside Zenith Bank', 'Garki', false),
  mkAddress('addr-4', 'Gym', '9 Gana Street', 'Opposite Transcorp Hilton', 'Maitama', false),
];

function mkAddress(id: string, label: string, street: string, landmark: string, area: AbujaArea, isDefault: boolean): Address {
  const c = AREA_COORDS[area];
  return {
    id,
    userId: DEMO_CUSTOMER.id,
    label,
    street,
    landmark,
    area,
    city: 'Abuja',
    state: 'FCT',
    country: 'Nigeria',
    latitude: c.lat,
    longitude: c.lng,
    isDefault,
    createdAt: '2026-01-04T08:05:00.000Z',
    updatedAt: '2026-01-04T08:05:00.000Z',
  };
}

interface RiderSeed {
  first: string;
  last: string;
  phone: string;
  kyc: 'pending' | 'approved' | 'rejected';
  status: 'online' | 'offline' | 'on_trip';
  vehicle: VehicleType;
  plate: string;
  zone: AbujaArea;
  rating: number;
  deliveries: number;
}

const RIDER_SEEDS: RiderSeed[] = [
  { first: 'Emeka', last: 'Nwosu', phone: '08050000001', kyc: 'approved', status: 'online', vehicle: 'motorcycle', plate: 'ABC 123 XY', zone: 'Wuse 2', rating: 4.9, deliveries: 156 },
  { first: 'Fatima', last: 'Bello', phone: '08050000002', kyc: 'approved', status: 'on_trip', vehicle: 'motorcycle', plate: 'DEF 456 AB', zone: 'Garki', rating: 4.8, deliveries: 203 },
  { first: 'Tunde', last: 'Adeyemi', phone: '08050000003', kyc: 'approved', status: 'online', vehicle: 'van', plate: 'GHI 789 CD', zone: 'Maitama', rating: 4.7, deliveries: 89 },
  { first: 'Ngozi', last: 'Okafor', phone: '08050000004', kyc: 'approved', status: 'offline', vehicle: 'motorcycle', plate: 'JKL 012 EF', zone: 'Jabi', rating: 4.6, deliveries: 67 },
  { first: 'Ibrahim', last: 'Sani', phone: '08050000005', kyc: 'pending', status: 'offline', vehicle: 'truck', plate: 'MNO 345 GH', zone: 'Kubwa', rating: 0, deliveries: 0 },
  { first: 'Blessing', last: 'Eze', phone: '08050000006', kyc: 'pending', status: 'offline', vehicle: 'motorcycle', plate: 'PQR 678 IJ', zone: 'Utako', rating: 0, deliveries: 0 },
  { first: 'Yusuf', last: 'Musa', phone: '08050000007', kyc: 'rejected', status: 'offline', vehicle: 'van', plate: 'STU 901 KL', zone: 'Lugbe', rating: 0, deliveries: 0 },
  { first: 'Chioma', last: 'Nnamdi', phone: '08050000008', kyc: 'approved', status: 'online', vehicle: 'van', plate: 'VWX 234 MN', zone: 'Asokoro', rating: 4.9, deliveries: 121 },
];

export interface RiderFixture {
  user: User;
  profile: RiderProfile;
}

export const DEMO_RIDERS: RiderFixture[] = RIDER_SEEDS.map((s, i) => {
  const id = `rider-${i + 1}`;
  const c = AREA_COORDS[s.zone];
  return {
    user: {
      id,
      phone: s.phone,
      email: `${s.first.toLowerCase()}.${s.last.toLowerCase()}@example.com`,
      firstName: s.first,
      lastName: s.last,
      role: 'rider',
      kycStatus: s.kyc,
      isActive: true,
      isPhoneVerified: true,
      createdAt: '2026-01-02T09:00:00.000Z',
    },
    profile: {
      id: `rprof-${i + 1}`,
      userId: id,
      vehicleType: s.vehicle,
      vehiclePlate: s.plate,
      vehicleModel: s.vehicle === 'motorcycle' ? 'Honda CG 125' : s.vehicle === 'van' ? 'Toyota HiAce' : 'Mitsubishi Canter',
      vehicleColor: 'Blue',
      zone: s.zone,
      status: s.status,
      currentLatitude: c.lat,
      currentLongitude: c.lng,
      lastLocationUpdate: '2026-10-07T06:30:00.000Z',
      rating: s.rating,
      totalDeliveries: s.deliveries,
      cancelledDeliveries: 1,
      failedDeliveries: 0,
      createdAt: '2026-01-02T09:05:00.000Z',
    },
  };
});

const AREA_PAIRS: Array<[AbujaArea, AbujaArea]> = [
  ['Wuse 2', 'Garki'],
  ['Maitama', 'Asokoro'],
  ['Jabi', 'Utako'],
  ['Gwarinpa', 'CBD'],
  ['Wuse 2', 'Maitama'],
  ['Kubwa', 'CBD'],
  ['Lugbe', 'Wuse 2'],
  ['Garki', 'Asokoro'],
  ['Utako', 'Maitama'],
  ['Jabi', 'Gwarinpa'],
  ['CBD', 'Garki'],
  ['Asokoro', 'Wuse 2'],
];

interface DeliverySeed {
  status: DeliveryStatus;
  rider?: number;
  attempts?: number;
  failureReason?: string;
  packageType?: PackageType;
  weight?: number;
}

const DELIVERY_SEEDS: DeliverySeed[] = [
  { status: 'requested' },
  { status: 'requested' },
  { status: 'searching' },
  { status: 'searching' },
  { status: 'assigned', rider: 0 },
  { status: 'assigned', rider: 1 },
  { status: 'assigned', rider: 2 },
  { status: 'picked_up', rider: 0 },
  { status: 'picked_up', rider: 1 },
  { status: 'in_transit', rider: 1 },
  { status: 'in_transit', rider: 2 },
  { status: 'in_transit', rider: 7 },
  { status: 'delivered', rider: 0 },
  { status: 'delivered', rider: 1 },
  { status: 'delivered', rider: 2 },
  { status: 'delivered', rider: 7 },
  { status: 'delivered', rider: 0 },
  { status: 'delivered', rider: 2 },
  { status: 'failed', rider: 1, attempts: 1, failureReason: 'recipient_unavailable' },
  { status: 'failed', rider: 3, attempts: 1, failureReason: 'wrong_address' },
  // redelivery attempt 2 (searching, one attempt already used)
  { status: 'searching', attempts: 1, weight: 5 },
  { status: 'returned', rider: 2, attempts: 2, failureReason: 'refused' },
  { status: 'cancelled' },
  { status: 'cancelled', rider: 0 },
];

export const DEMO_DELIVERIES: Delivery[] = DELIVERY_SEEDS.map((seed, i) => {
  const n = i + 1;
  const [pickupArea, dropoffArea] = AREA_PAIRS[i % AREA_PAIRS.length];
  const packageType: PackageType = seed.packageType ?? (i % 3 === 0 ? 'document' : 'parcel');
  const weight = seed.weight ?? (packageType === 'document' ? 0.5 : [1, 5, 10][i % 3]);
  const distanceKm = distanceBetween(pickupArea, dropoffArea);
  const fare = calculateFare(DEFAULT_PRICING, { distanceKm, weightKg: weight, packageType }).totalFare;
  const riderFixture = seed.rider !== undefined ? DEMO_RIDERS[seed.rider] : undefined;
  const createdAt = `2026-09-${((i % 27) + 1).toString().padStart(2, '0')}T09:${(i % 60).toString().padStart(2, '0')}:00.000Z`;

  const delivery: Delivery = {
    id: `del-${n.toString().padStart(3, '0')}`,
    trackingNumber: `TLK-2026-${n.toString().padStart(3, '0')}`,
    customerId: DEMO_CUSTOMER.id,
    riderId: riderFixture ? riderFixture.user.id : null,
    pickupStreet: `${n} ${pickupArea} Road`,
    pickupLandmark: `Near ${pickupArea} Market`,
    pickupArea,
    pickupLatitude: AREA_COORDS[pickupArea].lat,
    pickupLongitude: AREA_COORDS[pickupArea].lng,
    dropoffStreet: `${n + 40} ${dropoffArea} Avenue`,
    dropoffLandmark: `Opposite ${dropoffArea} Plaza`,
    dropoffArea,
    dropoffLatitude: AREA_COORDS[dropoffArea].lat,
    dropoffLongitude: AREA_COORDS[dropoffArea].lng,
    packageType,
    packageWeight: weight,
    packageDescription: packageType === 'document' ? 'Legal documents' : 'Personal effects',
    senderName: `${DEMO_CUSTOMER.firstName} ${DEMO_CUSTOMER.lastName}`,
    senderPhone: DEMO_CUSTOMER.phone,
    recipientName: ['Chinedu Obi', 'Halima Yusuf', 'Segun Adeleke', 'Zainab Bala'][i % 4],
    recipientPhone: `0806000${(i % 10).toString()}${(i % 10).toString()}`.slice(0, 11),
    status: seed.status,
    failureReason: seed.failureReason ?? null,
    redeliveryAttempts: seed.attempts ?? 0,
    fare,
    paymentReference: seed.status === 'requested' ? null : `TLK_PS_${n.toString().padStart(6, '0')}`,
    createdAt,
    updatedAt: createdAt,
    recipientCode: RECIPIENT_CODE,
    rider: riderFixture ? riderFixture.user : null,
    customer: DEMO_CUSTOMER,
  };
  delivery.events = buildEvents(delivery);
  return delivery;
});

function buildEvents(d: Delivery): DeliveryEvent[] {
  const order: DeliveryStatus[] = ['requested', 'searching', 'assigned', 'picked_up', 'in_transit', 'delivered'];
  const idx = order.indexOf(d.status);
  const upto = d.status === 'failed' || d.status === 'returned'
    ? order // failed/returned follow in_transit in this fixture ordering
    : order.slice(0, (idx >= 0 ? idx : 0) + 1);
  const chain: DeliveryStatus[] = d.status === 'failed' || d.status === 'returned' ? ['requested', 'searching', 'assigned', 'picked_up', 'in_transit', d.status] : upto;
  if (d.status === 'cancelled') {
    return [mkEvent(d, 'requested', 0), mkEvent(d, 'cancelled', 1)];
  }
  return chain.map((status, i) => mkEvent(d, status, i));
}

function mkEvent(d: Delivery, status: DeliveryStatus, i: number): DeliveryEvent {
  return {
    id: `${d.id}-ev-${i}`,
    deliveryId: d.id,
    status,
    actorId: i === 0 ? d.customerId : status === 'assigned' ? 'admin-1' : d.riderId,
    actorRole: i === 0 ? 'customer' : status === 'assigned' ? 'admin' : 'rider',
    notes: null,
    latitude: null,
    longitude: null,
    createdAt: d.createdAt,
  };
}

const NOTIF_TITLES: Array<[string, string]> = [
  ['Delivery Requested', 'Your delivery request has been received.'],
  ['Finding a Rider', "We're looking for an available rider near you."],
  ['Rider Assigned', 'Your rider is on the way to pick up your package.'],
  ['Package Picked Up', 'Your rider has picked up the package.'],
  ['In Transit', 'Your package is on the way to the destination.'],
  ['Delivered', 'Your package has been delivered successfully.'],
  ['Delivery Issue', 'There was an issue with the delivery.'],
  ['Returned to Sender', 'The package could not be delivered and is being returned.'],
  ['Delivery Cancelled', 'Your delivery has been cancelled.'],
];

export const DEMO_NOTIFICATIONS: Notification[] = Array.from({ length: 12 }, (_, i) => {
  const delivery = DEMO_DELIVERIES[i % DEMO_DELIVERIES.length];
  const [title, body] = NOTIF_TITLES[i % NOTIF_TITLES.length];
  return {
    id: `notif-${(i + 1).toString().padStart(3, '0')}`,
    deliveryId: delivery.id,
    userId: DEMO_CUSTOMER.id,
    channel: i % 3 === 0 ? 'sms' : 'push',
    title,
    body,
    data: { deliveryId: delivery.id, status: delivery.status },
    status: 'sent',
    sentAt: delivery.createdAt,
    createdAt: delivery.createdAt,
  };
});

export const DEMO_ISSUES: Issue[] = [
  mkIssue('issue-001', DEMO_DELIVERIES[18].id, 'delivery_issue', 'high', 'Package not received', 'Recipient says no one arrived.'),
  mkIssue('issue-002', DEMO_DELIVERIES[13].id, 'delivery_issue', 'medium', 'Late delivery', 'Arrived over an hour late.'),
  mkIssue('issue-003', DEMO_DELIVERIES[22].id, 'payment_issue', 'high', 'Charged after cancel', 'Fare was charged despite cancelling.'),
  mkIssue('issue-004', DEMO_DELIVERIES[5].id, 'rider_issue', 'low', 'Rider rude', 'Rider was unhelpful on the phone.'),
  mkIssue('issue-005', DEMO_DELIVERIES[21].id, 'other', 'medium', 'Receipt missing', 'Cannot find the receipt in history.'),
  mkIssue('issue-006', DEMO_DELIVERIES[10].id, 'delivery_issue', 'urgent', 'Wrong address', 'Rider went to the wrong street.'),
];

function mkIssue(id: string, deliveryId: string, type: Issue['type'], priority: Issue['priority'], title: string, description: string): Issue {
  return {
    id,
    deliveryId,
    reporterId: DEMO_CUSTOMER.id,
    assignedToId: null,
    type,
    status: 'open',
    priority,
    title,
    description,
    attachments: [],
    resolution: null,
    resolvedAt: null,
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
  };
}
