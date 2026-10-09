/**
 * Admin mock world — same Abuja/Nigeria data as the mobile apps (tracking numbers TLK-2026-0xx,
 * naira fares, Abuja areas). Actions mutate this state in memory (see AdminDataContext).
 * Duplicated from apps/shared by design — SC-40.
 */
import type { AdminState, Delivery, DeliveryEvent, DeliveryStatus, Issue, PricingConfig, RiderProfile, AdminUser } from './types';

/** ISO timestamp N days before the fixed demo "today" (2026-10-07). */
const daysAgo = (days: number, hour = 9): string =>
  new Date(Date.UTC(2026, 9, 7, hour, 0, 0) - days * 86_400_000).toISOString();

function events(status: DeliveryStatus, createdAt: string, extra: Partial<DeliveryEvent>[] = []): DeliveryEvent[] {
  const order: DeliveryStatus[] = ['requested', 'searching', 'assigned', 'picked_up', 'in_transit', 'delivered'];
  const terminal: DeliveryStatus[] = ['failed', 'returned', 'cancelled'];
  const chain = terminal.includes(status) ? [...order.slice(0, 5), status] : order.slice(0, order.indexOf(status) + 1);
  return chain
    .map((step, index): DeliveryEvent => ({
      id: `ev-${index}`,
      status: step,
      at: new Date(Date.parse(createdAt) + index * 45 * 60_000).toISOString(),
      note: step === 'requested' ? 'Delivery requested' : undefined,
      actorRole: step === 'assigned' ? 'admin' : step === 'delivered' || step === 'failed' ? 'rider' : 'customer',
    }))
    .map((event, index) => ({ ...event, ...(extra[index] ?? {}) }));
}

interface Seed {
  status: DeliveryStatus;
  riderId?: string;
  attempts?: number;
  type?: 'document' | 'parcel';
  weight?: number;
}

const SEEDS: Seed[] = [
  { status: 'requested' },
  { status: 'requested', type: 'document', weight: 1 },
  { status: 'searching' },
  { status: 'searching', type: 'document', weight: 1 },
  { status: 'assigned', riderId: 'rider-1' },
  { status: 'assigned', riderId: 'rider-2' },
  { status: 'picked_up', riderId: 'rider-3' },
  { status: 'in_transit', riderId: 'rider-1' },
  { status: 'delivered', riderId: 'rider-2' },
  { status: 'delivered', riderId: 'rider-3' },
  { status: 'failed', riderId: 'rider-4', attempts: 1 },
  { status: 'returned', riderId: 'rider-2', attempts: 2 },
];

const AREA_PAIRS: Array<[string, string]> = [
  ['Wuse 2', 'Garki'],
  ['Maitama', 'Asokoro'],
  ['Jabi', 'Utako'],
  ['Gwarinpa', 'Wuse 2'],
  ['Kubwa', 'Maitama'],
  ['Lugbe', 'Garki'],
];

const CUSTOMERS = [
  ['Amina Bello', '08031234567'],
  ['Chinedu Obi', '08060000001'],
  ['Halima Yusuf', '08060000002'],
  ['Segun Adeleke', '08060000003'],
];

const RECIPIENTS = [
  ['Zainab Bala', '08070000001'],
  ['Emeka Nwosu', '08070000002'],
  ['Fatima Bello', '08070000003'],
  ['Tunde Adeyemi', '08070000004'],
];

const RIDERS: Array<[string, string, string, string, string, RiderProfile['vehicleType'], string, RiderProfile['status'], RiderProfile['kycStatus'], number, number]> = [
  ['rider-1', 'Emeka', 'Nwosu', '08050000001', 'Wuse 2', 'motorcycle', 'ABC 123 XY', 'online', 'approved', 4.9, 156],
  ['rider-2', 'Fatima', 'Bello', '08050000002', 'Garki', 'motorcycle', 'DEF 456 AB', 'on_trip', 'approved', 4.8, 203],
  ['rider-3', 'Tunde', 'Adeyemi', '08050000003', 'Maitama', 'van', 'GHI 789 CD', 'online', 'approved', 4.7, 89],
  ['rider-4', 'Ngozi', 'Okafor', '08050000004', 'Jabi', 'motorcycle', 'JKL 012 EF', 'offline', 'approved', 4.6, 67],
  ['rider-5', 'Ibrahim', 'Sani', '08050000005', 'Kubwa', 'truck', 'MNO 345 GH', 'offline', 'pending', 0, 0],
  ['rider-6', 'Blessing', 'Eze', '08050000006', 'Utako', 'motorcycle', 'PQR 678 IJ', 'offline', 'pending', 0, 0],
  ['rider-7', 'Yusuf', 'Musa', '08050000007', 'Lugbe', 'van', 'STU 901 KL', 'offline', 'rejected', 0, 0],
  ['rider-8', 'Chioma', 'Nnamdi', '08050000008', 'Asokoro', 'van', 'VWX 234 MN', 'online', 'approved', 4.9, 121],
];

function mkRiders(): RiderProfile[] {
  return RIDERS.map(([id, first, last, phone, zone, vehicle, plate, status, kyc, rating, total]) => ({
    id,
    firstName: first,
    lastName: last,
    phone,
    email: `${first.toLowerCase()}.${last.toLowerCase()}@example.com`,
    vehicleType: vehicle,
    vehiclePlate: plate,
    zone,
    status,
    kycStatus: kyc,
    kycRejectionReason: kyc === 'rejected' ? 'The vehicle registration photo was unreadable. Please upload a clearer photo.' : null,
    rating,
    totalDeliveries: total,
    documents: {
      nin: '12345678901',
      idFront: `file://kyc/${id}-id-front.jpg`,
      idBack: `file://kyc/${id}-id-back.jpg`,
      selfie: `file://kyc/${id}-selfie.jpg`,
      vehicleRegistration: `file://kyc/${id}-vehicle.jpg`,
    },
  }));
}

function mkDeliveries(): Delivery[] {
  return SEEDS.map((seed, index) => {
    const n = index + 1;
    const [pickupArea, dropoffArea] = AREA_PAIRS[index % AREA_PAIRS.length];
    const [customerName, customerPhone] = CUSTOMERS[index % CUSTOMERS.length];
    const [recipientName, recipientPhone] = RECIPIENTS[index % RECIPIENTS.length];
    const packageType = seed.type ?? (index % 3 === 0 ? 'parcel' : 'document');
    const packageWeight = seed.weight ?? (packageType === 'document' ? 1 : [5, 10, 25][index % 3]);
    const createdAt = daysAgo(index % 6, 8 + (index % 8));
    const delivered = seed.status === 'delivered';
    return {
      id: `del-${String(n).padStart(3, '0')}`,
      trackingNumber: `TLK-2026-${String(n).padStart(3, '0')}`,
      customerName,
      customerPhone,
      pickupStreet: `${n} ${pickupArea} Road`,
      pickupArea,
      dropoffStreet: `${n + 40} ${dropoffArea} Avenue`,
      dropoffArea,
      packageType,
      packageWeight,
      packageDescription: packageType === 'document' ? 'Legal documents' : 'Personal effects',
      senderName: customerName,
      senderPhone: customerPhone,
      recipientName,
      recipientPhone,
      status: seed.status,
      riderId: seed.riderId ?? null,
      fare: 1000 + ((n * 350) % 2600),
      paymentStatus: seed.status === 'requested' ? 'pending' : 'success',
      paymentReference: seed.status === 'requested' ? null : `TLK_PS_${String(n).padStart(6, '0')}`,
      redeliveryAttempts: seed.attempts ?? 0,
      createdAt,
      updatedAt: createdAt,
      events: events(seed.status, createdAt),
      pod: delivered
        ? {
            photoUrl: `file://pod/${`TLK-2026-${String(n).padStart(3, '0')}`}.jpg`,
            recipientName,
            recipientPhone,
            deliveredAt: new Date(Date.parse(createdAt) + 5 * 45 * 60_000).toISOString(),
            notes: 'Handed to the recipient at the drop-off point.',
          }
        : null,
    };
  });
}

function mkUsers(): AdminUser[] {
  const customers: AdminUser[] = CUSTOMERS.map(([name, phone], index) => {
    const [first, last] = name.split(' ');
    return {
      id: `cust-${index + 1}`,
      firstName: first,
      lastName: last,
      phone,
      email: `${first.toLowerCase()}.${last.toLowerCase()}@example.com`,
      role: 'customer' as const,
      isActive: true,
      createdAt: daysAgo(20 - index),
    };
  });
  const riders: AdminUser[] = RIDERS.map(([id, first, last, phone, , , , , , , ], index) => ({
    id,
    firstName: first,
    lastName: last,
    phone,
    email: `${first.toLowerCase()}.${last.toLowerCase()}@example.com`,
    role: 'rider' as const,
    isActive: index !== 5,
    createdAt: daysAgo(18 - index),
  }));
  return [...customers, ...riders, { id: 'admin-1', firstName: 'Ilyas', lastName: 'Adamu', phone: '08090000001', email: 'admin@trustlink.ng', role: 'admin', isActive: true, createdAt: daysAgo(30) }];
}

function mkIssues(): Issue[] {
  const seeds: Array<[string, Issue['type'], Issue['priority'], string, string, Issue['status']]> = [
    ['del-011', 'delivery_issue', 'urgent', 'Wrong address', 'Rider went to the wrong street.', 'open'],
    ['del-012', 'payment_issue', 'high', 'Charged after cancel', 'Fare was charged despite cancelling.', 'in_progress'],
    ['del-009', 'delivery_issue', 'medium', 'Late delivery', 'Arrived over an hour late.', 'resolved'],
    ['del-006', 'rider_issue', 'low', 'Rider was unhelpful', 'Rider did not answer when I called.', 'closed'],
    ['del-010', 'other', 'medium', 'Receipt missing', 'Cannot find the receipt in history.', 'open'],
    ['del-008', 'delivery_issue', 'high', 'Package not received', 'Recipient says no one arrived.', 'in_progress'],
  ];
  return seeds.map(([deliveryId, type, priority, title, description, status], index) => ({
    id: `issue-${String(index + 1).padStart(3, '0')}`,
    deliveryId,
    reporterName: index % 2 === 0 ? 'Amina Bello' : 'Chinedu Obi',
    type,
    priority,
    title,
    description,
    status,
    assignedToId: status === 'open' ? null : 'admin-1',
    resolution: status === 'resolved' ? 'We spoke to the rider and shared feedback with the dispatch team.' : null,
    createdAt: daysAgo(index + 1, 10),
    updatedAt: daysAgo(index + 1, 12),
  }));
}

const PRICING_SEED: Array<[string, number, string]> = [
  ['base_fare', 500, 'Flat charge on every delivery'],
  ['per_km_rate', 150, 'Charge per kilometre'],
  ['per_kg_rate', 100, 'Charge per kilogram'],
  ['minimum_fare', 1000, 'Fare floor for short trips'],
  ['weight_tier_1_max', 1, 'Tier 1 upper bound (kg)'],
  ['weight_tier_1_multiplier', 1, 'Tier 1 multiplier'],
  ['weight_tier_2_max', 5, 'Tier 2 upper bound (kg)'],
  ['weight_tier_2_multiplier', 1.5, 'Tier 2 multiplier'],
  ['weight_tier_3_max', 10, 'Tier 3 upper bound (kg)'],
  ['weight_tier_3_multiplier', 2, 'Tier 3 multiplier'],
  ['weight_tier_4_max', 25, 'Tier 4 upper bound (kg)'],
  ['weight_tier_4_multiplier', 3, 'Tier 4 multiplier'],
  ['distance_band_1_max', 5, 'Band 1 upper bound (km)'],
  ['distance_band_1_multiplier', 1, 'Band 1 multiplier'],
  ['distance_band_2_max', 15, 'Band 2 upper bound (km)'],
  ['distance_band_2_multiplier', 1.2, 'Band 2 multiplier'],
  ['distance_band_3_max', 50, 'Band 3 upper bound (km)'],
  ['distance_band_3_multiplier', 1.5, 'Band 3 multiplier'],
];

function mkPricing(): PricingConfig[] {
  return PRICING_SEED.map(([key, value, description]) => ({ key, value, description }));
}

export function createInitialState(): AdminState {
  return {
    deliveries: mkDeliveries(),
    riders: mkRiders(),
    users: mkUsers(),
    issues: mkIssues(),
    pricing: mkPricing(),
  };
}

/* ---------------- selectors ---------------- */

export const ACTIVE_STATUSES: DeliveryStatus[] = ['requested', 'searching', 'assigned', 'picked_up', 'in_transit'];
export const TERMINAL_STATUSES: DeliveryStatus[] = ['delivered', 'failed', 'returned', 'cancelled'];

export function unassigned(state: AdminState): Delivery[] {
  return state.deliveries.filter((d) => !d.riderId && (d.status === 'requested' || d.status === 'searching'));
}

export function needsRedelivery(state: AdminState): Delivery[] {
  return state.deliveries.filter((d) => d.status === 'failed');
}

export function reassignable(state: AdminState): Delivery[] {
  return state.deliveries.filter((d) => d.status === 'assigned' || d.status === 'picked_up');
}

/** Eligible riders for a delivery: approved + online, with a deterministic distance estimate. */
export function eligibleRiders(state: AdminState, delivery: Delivery): Array<{ rider: RiderProfile; distanceKm: number; etaMinutes: number }> {
  const letter = delivery.trackingNumber.charCodeAt(delivery.trackingNumber.length - 1);
  return state.riders
    .filter((rider) => rider.kycStatus === 'approved' && rider.status === 'online')
    .filter((rider) => rider.vehicleType !== 'motorcycle' || delivery.packageWeight <= 10)
    .map((rider, index) => {
      const distanceKm = 2 + ((index + letter) % 5);
      return { rider, distanceKm, etaMinutes: Math.ceil(distanceKm * 2) };
    })
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

export function kpis(state: AdminState) {
  const total = state.deliveries.length;
  const active = state.deliveries.filter((d) => ACTIVE_STATUSES.includes(d.status)).length;
  const awaitingDispatch = unassigned(state).length;
  const delivered = state.deliveries.filter((d) => d.status === 'delivered').length;
  const cancelled = state.deliveries.filter((d) => d.status === 'cancelled').length;
  const closed = state.deliveries.filter((d) => TERMINAL_STATUSES.includes(d.status)).length;
  const revenue = state.deliveries.filter((d) => d.paymentStatus === 'success').reduce((sum, d) => sum + d.fare, 0);
  return {
    total,
    active,
    awaitingDispatch,
    delivered,
    cancelled,
    ridersOnline: state.riders.filter((r) => r.status === 'online' || r.status === 'on_trip').length,
    ridersTotal: state.riders.length,
    kycPending: state.riders.filter((r) => r.kycStatus === 'pending').length,
    openIssues: state.issues.filter((i) => i.status === 'open' || i.status === 'in_progress').length,
    completionRate: closed ? delivered / closed : 0,
    cancellationRate: total ? cancelled / total : 0,
    revenue,
  };
}

export interface ReportRow {
  label: string;
  deliveries: number;
  delivered: number;
  cancelled: number;
  completionRate: number;
  cancellationRate: number;
  revenue: number;
}

export function report(state: AdminState, range: 'day' | 'week'): ReportRow[] {
  const buckets = new Map<string, Delivery[]>();
  for (const delivery of state.deliveries) {
    const date = new Date(delivery.createdAt);
    const key =
      range === 'day'
        ? date.toISOString().slice(0, 10)
        : `Week of ${new Date(date.getTime() - ((date.getUTCDay() + 6) % 7) * 86_400_000).toISOString().slice(0, 10)}`;
    buckets.set(key, [...(buckets.get(key) ?? []), delivery]);
  }
  return [...buckets.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([label, deliveries]) => {
      const closed = deliveries.filter((d) => TERMINAL_STATUSES.includes(d.status));
      const delivered = deliveries.filter((d) => d.status === 'delivered').length;
      const cancelled = deliveries.filter((d) => d.status === 'cancelled').length;
      return {
        label,
        deliveries: deliveries.length,
        delivered,
        cancelled,
        completionRate: closed.length ? delivered / closed.length : 0,
        cancellationRate: deliveries.length ? cancelled / deliveries.length : 0,
        revenue: deliveries.filter((d) => d.paymentStatus === 'success').reduce((sum, d) => sum + d.fare, 0),
      };
    });
}
