/**
 * Data ports — the boundary between screens/hooks and data sources.
 * Every method here has a mock adapter and an api adapter.
 */
import type {
  Address,
  AuthResult,
  CancelResult,
  CancellationPreview,
  CreateDeliveryInput,
  CreateIssueInput,
  Delivery,
  DeliveryStatus,
  FareBreakdown,
  Issue,
  IssueStatus,
  KycStatus,
  Notification,
  Payment,
  PricingConfig,
  PricingConfigKey,
  PricingValues,
  ProfileSetupInput,
  ProofInput,
  ProofOfDelivery,
  RiderProfile,
  RiderStatus,
  SubmitKycInput,
  User,
  UserRole,
  VehicleType,
  InitializePaymentInput,
} from '../../domain/types';

export interface AuthPort {
  requestOtp(input: { phone: string; purpose: 'signup' | 'login'; role?: UserRole; firstName?: string; lastName?: string }): Promise<{ message: string; userId?: string }>;
  verifyOtp(input: { phone: string; code: string; purpose: 'signup' | 'login' }): Promise<AuthResult>;
  resendOtp(input: { phone: string; purpose: 'signup' | 'login' }): Promise<{ message: string }>;
  /** re-establish the session for a persisted user (mock) — no-op against the real API (token already attached) */
  hydrate(user: User): Promise<void>;
  getProfile(): Promise<User>;
  updateProfile(patch: { firstName?: string; lastName?: string; email?: string }): Promise<User>;
  setupProfile(input: ProfileSetupInput): Promise<AuthResult>;
}

export interface DeliveryPort {
  create(input: CreateDeliveryInput): Promise<Delivery>;
  list(status?: DeliveryStatus): Promise<Delivery[]>;
  get(id: string): Promise<Delivery>;
  track(trackingNumber: string): Promise<Delivery>;
  listAddresses(): Promise<Address[]>;
  createAddress(input: Partial<Address>): Promise<Address>;
  updateAddress(id: string, patch: Partial<Address>): Promise<Address>;
  deleteAddress(id: string): Promise<void>;
  setDefaultAddress(id: string): Promise<void>;
  cancelPreview(id: string): Promise<CancellationPreview>;
  cancel(id: string): Promise<CancelResult>;
  proof(id: string): Promise<ProofOfDelivery | null>;
  resendRecipientOtp(id: string): Promise<{ sent: boolean }>;
}

export interface PricingPort {
  calculate(input: {
    distanceKm?: number;
    pickupArea?: string;
    dropoffArea?: string;
    pickupLatitude?: number;
    pickupLongitude?: number;
    dropoffLatitude?: number;
    dropoffLongitude?: number;
    weightKg: number;
    packageType: string;
  }): Promise<FareBreakdown>;
  /** Client-side distance estimate (km) for display/ETA only; the server computes the fare. */
  estimateDistance(input: { pickupArea: string; dropoffArea: string }): Promise<number>;
  getValues(): Promise<PricingValues>;
  getConfigs(): Promise<PricingConfig[]>;
  updateConfig(key: PricingConfigKey, value: number, description?: string): Promise<PricingConfig>;
}

export interface FilesPort {
  upload(input: { uri: string; name?: string; type?: string }): Promise<{ url: string }>;
}

export interface PaymentPort {
  initialize(input: InitializePaymentInput): Promise<{ paymentId: string; reference: string; authorizationUrl: string; accessCode?: string; status: string }>;
  getByReference(reference: string): Promise<Payment>;
  getByDelivery(deliveryId: string): Promise<Payment | null>;
  verify(reference: string): Promise<{ status: string; amount: number; paidAt?: string; channel?: string; gatewayResponse: string }>;
}

export interface NotificationPort {
  list(limit?: number): Promise<Notification[]>;
  markRead(id: string): Promise<Notification>;
  markAllRead(): Promise<{ updated: boolean }>;
  unreadCount(): Promise<{ unread: number }>;
}

export interface IssuePort {
  create(input: CreateIssueInput): Promise<Issue>;
  listMine(status?: IssueStatus): Promise<Issue[]>;
  get(id: string): Promise<Issue>;
  updateStatus(id: string, status: IssueStatus, resolution?: string): Promise<Issue>;
}

export interface KycPort {
  submit(input: SubmitKycInput): Promise<unknown>;
  status(): Promise<{ status: KycStatus; rejectionReason: string | null; submittedAt: string | null; reviewedAt: string | null }>;
  canGoOnline(): Promise<{ canGoOnline: boolean }>;
}

export interface RiderProfilePort {
  getProfile(): Promise<RiderProfile>;
  updateProfile(patch: { vehicleType?: VehicleType; vehiclePlate?: string; vehicleModel?: string; vehicleColor?: string; zone?: string }): Promise<RiderProfile>;
  toggleStatus(): Promise<RiderProfile>;
  setStatus(status: RiderStatus): Promise<RiderProfile>;
  updateLocation(latitude: number, longitude: number): Promise<RiderProfile>;
}

export interface DispatchPort {
  board(): Promise<Delivery[]>;
  eligibleRiders(deliveryId: string): Promise<Array<{ rider: RiderProfile; distanceKm: number; estimatedTimeMinutes: number }>>;
  assign(deliveryId: string, riderId: string): Promise<Delivery>;
  reassign(deliveryId: string, newRiderId: string, reason: string): Promise<Delivery>;
  myQueue(): Promise<Delivery[]>;
  acknowledge(deliveryId: string): Promise<Delivery>;
}

export interface ExecutionPort {
  pickup(deliveryId: string, latitude?: number, longitude?: number): Promise<Delivery>;
  inTransit(deliveryId: string, latitude?: number, longitude?: number): Promise<Delivery>;
  complete(deliveryId: string, proof: ProofInput): Promise<Delivery>;
  reportFailure(deliveryId: string, reason: string, latitude?: number, longitude?: number): Promise<Delivery>;
  scheduleRedelivery(deliveryId: string): Promise<Delivery>;
}

export interface AdminPort {
  listUsers(filter?: { role?: UserRole; isActive?: boolean }): Promise<User[]>;
  getUser(id: string): Promise<User>;
  updateKycStatus(userId: string, status: KycStatus, rejectionReason?: string): Promise<User>;
  toggleActive(userId: string): Promise<User>;
  pendingKyc(): Promise<unknown[]>;
  approveKyc(userId: string): Promise<unknown>;
  rejectKyc(userId: string, reason: string): Promise<unknown>;
  allDeliveries(status?: DeliveryStatus): Promise<Delivery[]>;
  allIssues(filter?: { status?: IssueStatus; priority?: string }): Promise<Issue[]>;
  assignIssue(id: string, assignedToId: string): Promise<Issue>;
}

export interface DataPorts {
  auth: AuthPort;
  delivery: DeliveryPort;
  pricing: PricingPort;
  payment: PaymentPort;
  files: FilesPort;
  notification: NotificationPort;
  issue: IssuePort;
  kyc: KycPort;
  rider: RiderProfilePort;
  dispatch: DispatchPort;
  execution: ExecutionPort;
  admin: AdminPort;
}
