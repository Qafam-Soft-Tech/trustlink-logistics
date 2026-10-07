/**
 * TrustLink domain types — mirror of docs/frontend/CONTRACT_SNAPSHOT.md.
 * Pure TypeScript: no React / React Native imports.
 */

export type UserRole = 'customer' | 'rider' | 'admin';

export type KycStatus = 'pending' | 'approved' | 'rejected';

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

export type KycDocumentType = 'nin' | 'id_front' | 'id_back' | 'selfie' | 'vehicle_registration';

export type IssueType = 'delivery_issue' | 'payment_issue' | 'rider_issue' | 'other';
export type IssueStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type IssuePriority = 'low' | 'medium' | 'high' | 'urgent';

export type NotificationChannel = 'push' | 'sms' | 'email';
export type NotificationStatus = 'pending' | 'sent' | 'failed';

export type PaymentProvider = 'paystack' | 'flutterwave';
export type PaymentStatus = 'pending' | 'processing' | 'success' | 'failed' | 'cancelled' | 'refunded';
export type PaymentChannel = 'card' | 'bank_transfer' | 'ussd' | 'mobile_money' | 'qr_code';

export type PricingConfigKey =
  | 'base_fare'
  | 'per_km_rate'
  | 'per_kg_rate'
  | 'minimum_fare'
  | 'weight_tier_1_max'
  | 'weight_tier_1_multiplier'
  | 'weight_tier_2_max'
  | 'weight_tier_2_multiplier'
  | 'weight_tier_3_max'
  | 'weight_tier_3_multiplier'
  | 'weight_tier_4_max'
  | 'weight_tier_4_multiplier'
  | 'distance_band_1_max'
  | 'distance_band_1_multiplier'
  | 'distance_band_2_max'
  | 'distance_band_2_multiplier'
  | 'distance_band_3_max'
  | 'distance_band_3_multiplier';

export type FailureReason = 'recipient_unavailable' | 'wrong_address' | 'refused';

export interface User {
  id: string;
  phone: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  role: UserRole;
  kycStatus?: KycStatus | null;
  kycRejectionReason?: string | null;
  avatarUrl?: string | null;
  isActive: boolean;
  isPhoneVerified: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResult {
  user: User;
  token: string;
}

export interface Address {
  id: string;
  userId: string;
  label: string;
  street: string;
  landmark?: string | null;
  area?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface DeliveryEvent {
  id: string;
  deliveryId: string;
  status: DeliveryStatus;
  actorId?: string | null;
  actorRole?: UserRole | null;
  notes?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  createdAt: string;
}

export interface Delivery {
  id: string;
  trackingNumber: string;
  customerId: string;
  riderId: string | null;
  pickupStreet: string;
  pickupLandmark?: string | null;
  pickupArea?: string | null;
  pickupLatitude?: number | null;
  pickupLongitude?: number | null;
  dropoffStreet: string;
  dropoffLandmark?: string | null;
  dropoffArea?: string | null;
  dropoffLatitude?: number | null;
  dropoffLongitude?: number | null;
  packageType: PackageType;
  packageWeight: number;
  packageDescription?: string | null;
  senderName: string;
  senderPhone: string;
  recipientName: string;
  recipientPhone: string;
  status: DeliveryStatus;
  failureReason?: string | null;
  redeliveryAttempts: number;
  assignedAt?: string | null;
  acknowledgedAt?: string | null;
  pickedUpAt?: string | null;
  deliveredAt?: string | null;
  cancelledAt?: string | null;
  fare?: number | null;
  paymentReference?: string | null;
  createdAt: string;
  updatedAt?: string;
  events?: DeliveryEvent[];
  /** demo-only: recipient delivery code (backend does not generate one — SC row) */
  recipientCode?: string;
  rider?: User | null;
  customer?: User | null;
}

export interface ProofOfDelivery {
  id: string;
  deliveryId: string;
  photoUrl: string;
  recipientOtp: string;
  recipientName: string;
  recipientPhone: string;
  latitude?: number | null;
  longitude?: number | null;
  notes?: string | null;
  createdAt: string;
}

export interface RiderProfile {
  id: string;
  userId: string;
  vehicleType: VehicleType;
  vehiclePlate: string;
  vehicleModel?: string | null;
  vehicleColor?: string | null;
  zone?: string | null;
  status: RiderStatus;
  currentLatitude?: number | null;
  currentLongitude?: number | null;
  lastLocationUpdate?: string | null;
  rating: number;
  totalDeliveries: number;
  cancelledDeliveries: number;
  failedDeliveries: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Issue {
  id: string;
  deliveryId: string;
  reporterId: string;
  assignedToId?: string | null;
  type: IssueType;
  status: IssueStatus;
  priority: IssuePriority;
  title: string;
  description: string;
  attachments?: string[] | null;
  resolution?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface Notification {
  id: string;
  deliveryId: string;
  userId: string;
  channel: NotificationChannel;
  title: string;
  body: string;
  data?: Record<string, unknown> | null;
  status: NotificationStatus;
  sentAt?: string | null;
  createdAt: string;
}

export interface PricingConfig {
  id?: string;
  key: PricingConfigKey;
  value: number;
  description?: string | null;
}

export type PricingValues = Record<PricingConfigKey, number>;

export interface FareBreakdown {
  baseFare: number;
  distanceCharge: number;
  weightCharge: number;
  subtotal: number;
  minimumFare: number;
  totalFare: number;
  weightTier: { max: number; multiplier: number };
  distanceBand: { max: number; multiplier: number };
}

export interface Payment {
  id: string;
  deliveryId: string;
  reference: string;
  providerReference?: string | null;
  provider: PaymentProvider;
  status: PaymentStatus;
  amount: number;
  currency: string;
  channel?: PaymentChannel | null;
  authorizationUrl?: string | null;
  accessCode?: string | null;
  paidAt?: string | null;
  failedAt?: string | null;
  failureReason?: string | null;
  gatewayResponse?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CancellationPreview {
  canCancel: boolean;
  fee: number;
  refundAmount: number;
  reason: string;
}

export interface CancelResult {
  cancelled: boolean;
  fee: number;
  refundAmount: number;
}

/* ---- request inputs ---- */

export interface CreateDeliveryInput {
  pickupStreet: string;
  pickupLandmark?: string;
  pickupArea?: string;
  pickupLatitude?: number;
  pickupLongitude?: number;
  dropoffStreet: string;
  dropoffLandmark?: string;
  dropoffArea?: string;
  dropoffLatitude?: number;
  dropoffLongitude?: number;
  packageType: PackageType;
  packageWeight: number;
  packageDescription?: string;
  senderName: string;
  senderPhone: string;
  recipientName: string;
  recipientPhone: string;
}

export interface ProfileSetupInput {
  phone: string;
  firstName: string;
  lastName: string;
  email?: string;
  role: UserRole;
  vehicleType?: string;
  vehiclePlate?: string;
}

export interface SubmitKycInput {
  nin: string;
  idType: KycDocumentType;
  idFrontUrl: string;
  idBackUrl: string;
  selfieUrl: string;
  vehicleRegistrationUrl: string;
  vehicleType: string;
  vehiclePlate: string;
}

export interface CreateIssueInput {
  deliveryId: string;
  type: IssueType;
  priority: IssuePriority;
  title: string;
  description: string;
  attachments?: string[];
}

export interface ProofInput {
  photoUrl: string;
  recipientOtp: string;
  recipientName: string;
  recipientPhone: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
}

export interface InitializePaymentInput {
  deliveryId: string;
  /** amount in naira; the api adapter converts to kobo at the boundary (see SC-16) */
  amountNaira: number;
  email?: string;
  phone?: string;
  provider: PaymentProvider;
}
