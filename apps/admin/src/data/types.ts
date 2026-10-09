/**
 * Admin-local domain types.
 * Mirrors the contract field names from docs/frontend/CONTRACT_SNAPSHOT.md and the mobile
 * domain types. The admin app does not import @trustlink/shared (no workspace/alias — BASELINE.md),
 * so these are deliberately duplicated — see CONTRACT_LEDGER.md SC-40.
 */

export type DeliveryStatus =
  | 'requested'
  | 'searching'
  | 'assigned'
  | 'picked_up'
  | 'in_transit'
  | 'delivered'
  | 'failed'
  | 'returned'
  | 'cancelled';

export type PackageType = 'document' | 'parcel';
export type VehicleType = 'motorcycle' | 'van' | 'truck';
export type RiderStatus = 'online' | 'offline' | 'on_trip';
export type KycStatus = 'pending' | 'approved' | 'rejected';
export type IssueType = 'delivery_issue' | 'payment_issue' | 'rider_issue' | 'other';
export type IssueStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type IssuePriority = 'low' | 'medium' | 'high' | 'urgent';
export type PaymentStatus = 'pending' | 'processing' | 'success' | 'failed' | 'cancelled' | 'refunded';
export type UserRole = 'customer' | 'rider' | 'admin';

export interface DeliveryEvent {
  id: string;
  status: DeliveryStatus;
  at: string;
  note?: string;
  actorRole?: UserRole;
}

export interface ProofOfDelivery {
  photoUrl: string;
  recipientName: string;
  recipientPhone: string;
  deliveredAt: string;
  notes?: string;
}

export interface Delivery {
  id: string;
  trackingNumber: string;
  customerName: string;
  customerPhone: string;
  pickupStreet: string;
  pickupArea: string;
  dropoffStreet: string;
  dropoffArea: string;
  packageType: PackageType;
  packageWeight: number;
  packageDescription?: string;
  senderName: string;
  senderPhone: string;
  recipientName: string;
  recipientPhone: string;
  status: DeliveryStatus;
  riderId: string | null;
  fare: number;
  paymentStatus: PaymentStatus;
  paymentReference: string | null;
  redeliveryAttempts: number;
  createdAt: string;
  updatedAt: string;
  events: DeliveryEvent[];
  pod: ProofOfDelivery | null;
}

export interface RiderProfile {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  vehicleType: VehicleType;
  vehiclePlate: string;
  zone: string;
  status: RiderStatus;
  kycStatus: KycStatus;
  kycRejectionReason?: string | null;
  rating: number;
  totalDeliveries: number;
  documents: Record<'nin' | 'idFront' | 'idBack' | 'selfie' | 'vehicleRegistration', string>;
}

export interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

export interface Issue {
  id: string;
  deliveryId: string;
  reporterName: string;
  type: IssueType;
  priority: IssuePriority;
  title: string;
  description: string;
  status: IssueStatus;
  assignedToId: string | null;
  resolution?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PricingConfig {
  key: string;
  value: number;
  description: string;
}

export interface AdminState {
  deliveries: Delivery[];
  riders: RiderProfile[];
  users: AdminUser[];
  issues: Issue[];
  pricing: PricingConfig[];
}

export const NGN = (amount: number): string =>
  `\u20A6${new Intl.NumberFormat('en-NG').format(Math.round(amount))}`;

export const statusLabel = (status: DeliveryStatus): string =>
  ({
    requested: 'Requested',
    searching: 'Searching',
    assigned: 'Assigned',
    picked_up: 'Picked up',
    in_transit: 'In transit',
    delivered: 'Delivered',
    failed: 'Failed',
    returned: 'Returned',
    cancelled: 'Cancelled',
  })[status];

export const badgeClass = (status: string): string =>
  ({
    delivered: 'badge-success',
    approved: 'badge-success',
    resolved: 'badge-success',
    paid: 'badge-success',
    failed: 'badge-error',
    rejected: 'badge-error',
    urgent: 'badge-error',
    cancelled: 'badge-gray',
    closed: 'badge-gray',
    returned: 'badge-gray',
    searching: 'badge-warning',
    pending: 'badge-warning',
    requested: 'badge-info',
    assigned: 'badge-primary',
    picked_up: 'badge-info',
    in_transit: 'badge-primary',
    open: 'badge-warning',
    in_progress: 'badge-info',
    online: 'badge-success',
    offline: 'badge-gray',
    on_trip: 'badge-primary',
  })[status] ?? 'badge-gray';
