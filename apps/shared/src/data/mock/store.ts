/**
 * In-memory mock store + lifecycle engine.
 * Implements the INTENDED backend rules (CONTRACT_SNAPSHOT): transition table,
 * role rules, cancellation fee table, failure counters, redelivery, payment→SEARCHING,
 * POD (photo + matching recipient code), fare formula.
 */
import type {
  Address,
  CancelResult,
  CancellationPreview,
  CreateDeliveryInput,
  CreateIssueInput,
  Delivery,
  DeliveryEvent,
  DeliveryStatus,
  FareBreakdown,
  Issue,
  IssueStatus,
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
} from '../../domain/types';
import { calculateFare, DEFAULT_PRICING } from '../../domain/fare';
import { canTransition, computeCancellation, statusAfterFailure } from '../../domain/stateMachine';
import { OTP_EXPIRY_SECONDS, MAX_OTP_ATTEMPTS, DEMO_OTP } from '../../domain/constants';
import { estimateDistanceKm } from '../../domain/serviceArea';
import { ConflictError, NotFoundError, ValidationError } from '../http';
import type { RiderFixture } from '../../mocks/fixtures';
import type { MockFlags } from './transport';

export interface MockSession {
  user: User;
  token: string;
}

/** Deterministic demo auth flow state. */
export interface AuthFlow {
  phone: string;
  purpose: 'signup' | 'login';
  isNew: boolean;
  attempts: number;
  expiresAt: number;
  locked: boolean;
}

/** Phone whose account is permanently locked (demo: shows the locked state). */
export const LOCKED_ACCOUNT_PHONE = '08000000000';

export interface MockState {
  customer: User;
  /** registered customers keyed by phone (demo customer + any signed-up phones) */
  customers: Record<string, User>;
  addresses: Address[];
  deliveries: Delivery[];
  riders: RiderFixture[];
  notifications: Notification[];
  issues: Issue[];
  payments: Payment[];
  pricing: PricingValues;
  pricingConfigs: PricingConfig[];
  session: MockSession | null;
  authFlow: AuthFlow | null;
  lockedPhones: string[];
  flags: MockFlags;
  podByDelivery: Record<string, ProofOfDelivery>;
  /** payment verifications should fail (scenario `paymentFails`) */
  paymentShouldFail: boolean;
  /** payment verifications stay pending forever (scenario `paymentPending` → UI timeout) */
  paymentShouldHang: boolean;
  /** when the current rider last submitted KYC (distinguishes "not started" from "under review") */
  kycSubmittedAt: string | null;
}

let counter = 1000;
function nextId(prefix: string): string {
  counter += 1;
  return `${prefix}-${counter}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

export class MockStore {
  state: MockState;

  constructor(state: MockState) {
    this.state = state;
  }

  /* ---------------- auth ---------------- */
  private returningPhone(): string {
    return this.state.customer.phone;
  }

  authRequestOtp(input: { phone: string; purpose: 'signup' | 'login'; role?: UserRole }): { message: string; userId: string } {
    const phone = input.phone.replace(/\s/g, '');
    if (!/^0\d{10}$/.test(phone)) throw new ValidationError('Enter a valid 11-digit Nigerian phone number');
    if (phone === LOCKED_ACCOUNT_PHONE) throw new ConflictError('This account is locked. Contact support.');
    if (this.state.lockedPhones.includes(phone)) throw new ConflictError('Too many attempts. Account locked — use Demo menu → Reset data.');
    const isRider = this.state.riders.some((r) => r.user.phone === phone);
    const isNew = phone !== this.returningPhone() && !isRider;
    if (input.purpose === 'login' && isNew) throw new NotFoundError('No account found for this number');
    if (input.purpose === 'signup' && !isNew) throw new ConflictError('An account already exists for this number');
    this.state.session = null;
    this.state.authFlow = { phone, purpose: input.purpose, isNew, attempts: 0, expiresAt: Date.now() + OTP_EXPIRY_SECONDS * 1000, locked: false };
    return { message: 'OTP sent to phone number', userId: isNew ? `new-${phone}` : this.state.customer.id };
  }

  authResendOtp(input: { phone: string; purpose: 'signup' | 'login' }): { message: string } {
    const phone = input.phone.replace(/\s/g, '');
    if (this.state.lockedPhones.includes(phone)) throw new ConflictError('Too many attempts. Account locked — use Demo menu → Reset data.');
    if (!this.state.authFlow || this.state.authFlow.phone !== phone) throw new ValidationError('Request a new code first');
    this.state.authFlow.attempts = 0;
    this.state.authFlow.expiresAt = Date.now() + OTP_EXPIRY_SECONDS * 1000;
    return { message: 'OTP resent successfully' };
  }

  authVerifyOtp(input: { phone: string; code: string }): MockSession {
    const phone = input.phone.replace(/\s/g, '');
    const flow = this.state.authFlow;
    if (!flow || flow.phone !== phone) throw new ValidationError('Invalid or expired OTP');
    if (flow.locked) throw new ConflictError('Account locked — use Demo menu → Reset data.');
    if (Date.now() > flow.expiresAt) throw new ValidationError('OTP expired. Resend a new code.');
    if (input.code !== DEMO_OTP) {
      flow.attempts += 1;
      if (flow.attempts >= MAX_OTP_ATTEMPTS) {
        flow.locked = true;
        if (!this.state.lockedPhones.includes(phone)) this.state.lockedPhones.push(phone);
        throw new ValidationError('Too many attempts. Account locked — use Demo menu → Reset data.');
      }
      throw new ValidationError(`Incorrect code. ${MAX_OTP_ATTEMPTS - flow.attempts} attempt(s) left.`);
    }
    const riderUser = this.state.riders.find((r) => r.user.phone === phone)?.user;
    const user = riderUser ?? (flow.isNew ? this.ensureCustomer(phone) : this.state.customer);
    const session = { user, token: `mock-token-${user.id}` };
    this.state.session = session;
    return session;
  }

  private ensureCustomer(phone: string): User {
    if (!this.state.customers[phone]) {
      this.state.customers[phone] = {
        id: `new-${phone}`,
        phone,
        role: 'customer',
        kycStatus: 'pending',
        isActive: true,
        isPhoneVerified: true,
        createdAt: nowIso(),
      };
    }
    return this.state.customers[phone];
  }

  /** Demo control: force the pending OTP to be expired. */
  expireOtpNow(): void {
    if (this.state.authFlow) this.state.authFlow.expiresAt = 0;
  }

  getSession(): MockSession {
    if (!this.state.session) throw new ConflictError('Authentication required');
    return this.state.session;
  }

  /** Re-establish a session for a persisted user (app restored from SecureStore). */
  hydrateSession(user: User): void {
    this.state.session = { user, token: `mock-token-${user.id}` };
    if (!this.state.customers[user.phone]) this.state.customers[user.phone] = user;
  }

  updateProfile(patch: { firstName?: string; lastName?: string; email?: string }): User {
    const s = this.getSession();
    if (patch.firstName !== undefined) s.user.firstName = patch.firstName;
    if (patch.lastName !== undefined) s.user.lastName = patch.lastName;
    if (patch.email !== undefined) s.user.email = patch.email;
    return s.user;
  }

  setupProfile(input: ProfileSetupInput): MockSession {
    const phone = input.phone.replace(/\s/g, '');
    const riderUser = this.state.riders.find((r) => r.user.phone === phone)?.user;
    const user = riderUser ?? this.state.customers[phone] ?? this.state.customer;
    user.firstName = input.firstName;
    user.lastName = input.lastName;
    if (input.email) user.email = input.email;
    user.isPhoneVerified = true;
    const session = { user, token: `mock-token-${user.id}` };
    this.state.session = session;
    return session;
  }

  /* ---------------- delivery ---------------- */
  createDelivery(input: CreateDeliveryInput): Delivery {
    const s = this.getSession();
    if (s.user.role !== 'customer') throw new ConflictError('Only customers can create deliveries');
    if (input.senderPhone === input.recipientPhone) {
      throw new ValidationError('Recipient must be different from sender');
    }
    const n = this.state.deliveries.length + 1;
    const distanceKm = this.distance(input);
    const fare = calculateFare(this.state.pricing, { distanceKm, weightKg: input.packageWeight, packageType: input.packageType }).totalFare;
    const delivery: Delivery = {
      id: nextId('del'),
      trackingNumber: `TLK-2026-${n.toString().padStart(3, '0')}`,
      customerId: s.user.id,
      riderId: null,
      ...input,
      status: 'requested',
      redeliveryAttempts: 0,
      fare,
      paymentReference: null,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      recipientCode: '482913',
      customer: s.user,
      events: [],
    };
    this.pushEvent(delivery, 'requested', s.user.id, 'customer', 'Delivery requested');
    this.state.deliveries.unshift(delivery);
    return delivery;
  }

  private distance(input: { pickupArea?: string; dropoffArea?: string }): number {
    return estimateDistanceKm(input.pickupArea, input.dropoffArea);
  }

  listDeliveries(status?: DeliveryStatus): Delivery[] {
    const s = this.getSession();
    const all = this.state.deliveries.filter(
      (d) => (s.user.role === 'customer' ? d.customerId === s.user.id : s.user.role === 'rider' ? d.riderId === s.user.id : true),
    );
    const filtered = status ? all.filter((d) => d.status === status) : all;
    return filtered.map((d) => this.withRider(d));
  }

  listDeliveriesAdmin(status?: DeliveryStatus): Delivery[] {
    const all = status ? this.state.deliveries.filter((d) => d.status === status) : [...this.state.deliveries];
    return all.map((d) => this.withRider(d));
  }

  getDelivery(id: string): Delivery {
    const d = this.state.deliveries.find((x) => x.id === id);
    if (!d) throw new NotFoundError('Delivery not found');
    return this.withRider(d);
  }

  /** Attach the rider's vehicle type for the tracking rider card (demo-only field — SC-22). */
  private withRider(d: Delivery): Delivery {
    if (d.riderId) {
      const fixture = this.state.riders.find((x) => x.user.id === d.riderId);
      d.riderVehicleType = fixture?.profile.vehicleType ?? null;
    }
    return d;
  }

  /**
   * Intended behaviour the real backend does NOT implement (SC-43 / ledger): when a job ends
   * (delivered / failed / returned / cancelled) the rider goes back ONLINE, unless they still
   * have another active delivery. Without this a rider stays ON_TRIP forever and can never be
   * assigned again — which also made the demo script need a second rider.
   */
  private releaseRiderById(riderId?: string | null, exceptDeliveryId?: string): void {
    if (!riderId) return;
    const stillBusy = this.state.deliveries.some(
      (other) =>
        other.riderId === riderId &&
        other.id !== exceptDeliveryId &&
        ['assigned', 'picked_up', 'in_transit'].includes(other.status),
    );
    if (stillBusy) return;
    const fixture = this.state.riders.find((r) => r.user.id === riderId);
    if (fixture && fixture.profile.status === 'on_trip') fixture.profile.status = 'online';
  }

  track(trackingNumber: string): Delivery {
    this.getSession(); // requires a session, as the real API does
    const d = this.state.deliveries.find((x) => x.trackingNumber === trackingNumber);
    if (!d) throw new NotFoundError('Delivery not found');
    return this.withRider(d);
  }

  proof(id: string): ProofOfDelivery | null {
    const d = this.getDelivery(id);
    if (d.status !== 'delivered') return null;
    return this.state.podByDelivery[id] ?? null;
  }

  cancelPreview(id: string): CancellationPreview {
    const d = this.getDelivery(id);
    return computeCancellation(d.status, d.fare ?? 0);
  }

  cancel(id: string): CancelResult {
    const s = this.getSession();
    const d = this.getDelivery(id);
    if (d.customerId !== s.user.id) throw new ConflictError('Not authorized to cancel this delivery');
    const preview = computeCancellation(d.status, d.fare ?? 0);
    if (!preview.canCancel) throw new ConflictError('Cannot cancel delivery in current status');
    d.status = 'cancelled';
    d.cancelledAt = nowIso();
    this.pushEvent(d, 'cancelled', s.user.id, 'customer', 'Cancelled by customer');
    this.notify(d, 'Delivery Cancelled', 'Your delivery has been cancelled.', 'sms');
    this.releaseRiderById(d.riderId, d.id);
    return { cancelled: true, fee: preview.fee, refundAmount: preview.refundAmount };
  }

  private pushEvent(d: Delivery, status: DeliveryStatus, actorId: string | null, actorRole: UserRole, notes?: string): void {
    const event: DeliveryEvent = {
      id: nextId('ev'),
      deliveryId: d.id,
      status,
      actorId,
      actorRole,
      notes: notes ?? null,
      latitude: null,
      longitude: null,
      createdAt: nowIso(),
    };
    d.events = [...(d.events ?? []), event];
    d.updatedAt = event.createdAt;
  }

  private notify(d: Delivery, title: string, body: string, channel: 'push' | 'sms' | 'email'): void {
    this.state.notifications.unshift({
      id: nextId('notif'),
      deliveryId: d.id,
      userId: d.customerId,
      channel,
      title,
      body,
      status: 'sent',
      sentAt: nowIso(),
      createdAt: nowIso(),
      data: { deliveryId: d.id, status: d.status },
    });
  }

  private transition(d: Delivery, to: DeliveryStatus, actorId: string | null, actorRole: UserRole, notes?: string): Delivery {
    if (!canTransition(d.status, to)) {
      throw new ConflictError(`Cannot transition from ${d.status} to ${to}`);
    }
    d.status = to;
    if (to === 'assigned') d.assignedAt = nowIso();
    if (to === 'picked_up') d.pickedUpAt = nowIso();
    if (to === 'delivered') d.deliveredAt = nowIso();
    if (to === 'cancelled') d.cancelledAt = nowIso();
    this.pushEvent(d, to, actorId, actorRole, notes);
    return d;
  }

  /* ---------------- addresses ---------------- */
  listAddresses(): Address[] {
    const s = this.getSession();
    return this.state.addresses.filter((a) => a.userId === s.user.id);
  }
  createAddress(input: Partial<Address>): Address {
    const s = this.getSession();
    if (!input.street) throw new ValidationError('Street is required');
    const addr: Address = {
      id: nextId('addr'),
      userId: s.user.id,
      label: input.label ?? 'Home',
      street: input.street,
      landmark: input.landmark ?? null,
      area: input.area ?? null,
      city: input.city ?? 'Abuja',
      state: input.state ?? 'FCT',
      country: 'Nigeria',
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      isDefault: input.isDefault ?? false,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    this.state.addresses.push(addr);
    return addr;
  }
  updateAddress(id: string, patch: Partial<Address>): Address {
    const a = this.state.addresses.find((x) => x.id === id);
    if (!a) throw new NotFoundError('Address not found');
    Object.assign(a, patch, { updatedAt: nowIso() });
    return a;
  }
  deleteAddress(id: string): void {
    this.state.addresses = this.state.addresses.filter((a) => a.id !== id);
  }
  setDefaultAddress(id: string): void {
    const s = this.getSession();
    this.state.addresses.forEach((a) => {
      if (a.userId === s.user.id) a.isDefault = a.id === id;
    });
  }

  /* ---------------- pricing ---------------- */
  estimateDistance(input: { pickupArea: string; dropoffArea: string }): number {
    return estimateDistanceKm(input.pickupArea, input.dropoffArea);
  }
  calculateFare(input: {
    distanceKm?: number;
    pickupArea?: string;
    dropoffArea?: string;
    weightKg: number;
    packageType: string;
  }): FareBreakdown {
    const distanceKm = input.distanceKm ?? estimateDistanceKm(input.pickupArea, input.dropoffArea);
    return calculateFare(this.state.pricing, {
      distanceKm,
      weightKg: input.weightKg,
      packageType: input.packageType,
    });
  }
  updateConfig(key: PricingConfigKey, value: number, description?: string): PricingConfig {
    this.state.pricing[key] = value;
    let cfg = this.state.pricingConfigs.find((c) => c.key === key);
    if (!cfg) {
      cfg = { key, value, description };
      this.state.pricingConfigs.push(cfg);
    } else {
      cfg.value = value;
      if (description) cfg.description = description;
    }
    return cfg;
  }

  /* ---------------- payments ---------------- */
  initializePayment(input: { deliveryId: string; amountNaira: number; email?: string; phone?: string; provider: 'paystack' | 'flutterwave' }): Payment {
    const d = this.getDelivery(input.deliveryId);
    if (d.status !== 'requested') throw new ConflictError('Payment can only be initiated for REQUESTED deliveries');
    // No double-pay: a completed payment for this delivery blocks another (mirrors backend §12 SUCCESS rule).
    if (this.state.payments.some((p) => p.deliveryId === d.id && p.status === 'success')) {
      throw new ConflictError('This delivery has already been paid for');
    }
    const reference = `TLK_${nextId('ref').toUpperCase()}`;
    const payment: Payment = {
      id: nextId('pay'),
      deliveryId: d.id,
      reference,
      provider: input.provider,
      status: 'processing',
      amount: input.amountNaira,
      currency: 'NGN',
      authorizationUrl: `https://checkout.${input.provider}.com/test/${reference}`,
      accessCode: 'mock_access_code',
      createdAt: nowIso(),
    };
    this.state.payments.push(payment);
    return payment;
  }
  paymentByReference(reference: string): Payment {
    const p = this.state.payments.find((x) => x.reference === reference);
    if (!p) throw new NotFoundError('Payment not found');
    return p;
  }
  paymentByDelivery(deliveryId: string): Payment | null {
    return this.state.payments.find((x) => x.deliveryId === deliveryId) ?? null;
  }
  verifyPayment(reference: string): { status: string; amount: number; paidAt?: string; channel?: string; gatewayResponse: string } {
    const p = this.paymentByReference(reference);
    // Gateway still confirming — the UI polls and eventually times out (scenario `paymentPending`).
    if (this.state.paymentShouldHang) {
      return { status: 'pending', amount: p.amount, gatewayResponse: 'Pending' };
    }
    if (this.state.paymentShouldFail) {
      p.status = 'failed';
      p.failedAt = nowIso();
      p.failureReason = 'Card declined (test)';
      return { status: 'failed', amount: p.amount, gatewayResponse: 'Declined' };
    }
    p.status = 'success';
    p.paidAt = nowIso();
    p.channel = 'card';
    const d = this.getDelivery(p.deliveryId);
    if (d.status === 'requested') this.transition(d, 'searching', null, 'admin', 'Payment confirmed');
    d.paymentReference = p.reference;
    return { status: 'success', amount: p.amount, paidAt: p.paidAt, channel: 'card', gatewayResponse: 'Approved' };
  }

  /* ---------------- notifications ---------------- */
  listNotifications(limit = 20): Notification[] {
    const s = this.getSession();
    return this.state.notifications.filter((n) => n.userId === s.user.id).slice(0, limit);
  }

  markNotificationRead(id: string): Notification {
    const s = this.getSession();
    const notification = this.state.notifications.find((n) => n.id === id && n.userId === s.user.id);
    if (!notification) throw new NotFoundError('Notification not found');
    notification.readAt = nowIso();
    return notification;
  }

  markAllNotificationsRead(): { updated: boolean } {
    const s = this.getSession();
    this.state.notifications.forEach((n) => {
      if (n.userId === s.user.id && !n.readAt) n.readAt = nowIso();
    });
    return { updated: true };
  }

  unreadNotificationCount(): { unread: number } {
    const s = this.getSession();
    return { unread: this.state.notifications.filter((n) => n.userId === s.user.id && !n.readAt).length };
  }

  resendRecipientOtp(deliveryId: string): { sent: boolean } {
    const d = this.getDelivery(deliveryId);
    if (!['assigned', 'picked_up', 'in_transit'].includes(d.status)) {
      throw new ConflictError('Recipient OTP can only be sent while the delivery is active');
    }
    return { sent: true };
  }

  /* ---------------- issues ---------------- */
  createIssue(input: CreateIssueInput): Issue {
    const s = this.getSession();
    const d = this.getDelivery(input.deliveryId);
    if (d.customerId !== s.user.id && d.riderId !== s.user.id) {
      throw new ConflictError('You can only report issues for your own deliveries');
    }
    const issue: Issue = {
      id: nextId('issue'),
      deliveryId: input.deliveryId,
      reporterId: s.user.id,
      assignedToId: null,
      type: input.type,
      status: 'open',
      priority: input.priority,
      title: input.title,
      description: input.description,
      attachments: input.attachments ?? [],
      resolution: null,
      resolvedAt: null,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    this.state.issues.unshift(issue);
    return issue;
  }
  listMineIssues(status?: IssueStatus): Issue[] {
    const s = this.getSession();
    const mine = this.state.issues.filter((i) => i.reporterId === s.user.id);
    return status ? mine.filter((i) => i.status === status) : mine;
  }
  getIssue(id: string): Issue {
    const i = this.state.issues.find((x) => x.id === id);
    if (!i) throw new NotFoundError('Issue not found');
    return i;
  }
  updateIssueStatus(id: string, status: IssueStatus, resolution?: string): Issue {
    const i = this.getIssue(id);
    i.status = status;
    if (resolution) i.resolution = resolution;
    if (status === 'resolved' || status === 'closed') i.resolvedAt = nowIso();
    i.updatedAt = nowIso();
    return i;
  }

  /* ---------------- kyc ---------------- */
  submitKyc(input: SubmitKycInput): unknown {
    const s = this.getSession();
    if (s.user.role !== 'rider') throw new ConflictError('Only riders can submit KYC');
    if (!/^\d{11}$/.test(input.nin)) throw new ValidationError('Valid NIN (11 digits) is required');
    if (!input.idFrontUrl || !input.idBackUrl || !input.selfieUrl || !input.vehicleRegistrationUrl) {
      throw new ValidationError('All document uploads are required');
    }
    s.user.kycStatus = 'pending';
    this.state.kycSubmittedAt = nowIso();
    return { status: 'pending' };
  }
  kycStatus(): { status: NonNullable<User['kycStatus']>; rejectionReason: string | null; submittedAt: string | null; reviewedAt: string | null } {
    const s = this.getSession();
    return {
      status: s.user.kycStatus ?? 'pending',
      rejectionReason: s.user.kycRejectionReason ?? null,
      submittedAt: this.state.kycSubmittedAt,
      reviewedAt: null,
    };
  }
  canGoOnline(): { canGoOnline: boolean } {
    const s = this.getSession();
    return { canGoOnline: s.user.kycStatus === 'approved' };
  }

  /* ---------------- rider profile ---------------- */
  private riderProfileFor(userId: string): RiderProfile {
    let r = this.state.riders.find((x) => x.user.id === userId)?.profile;
    if (!r) {
      r = {
        id: nextId('rprof'),
        userId,
        vehicleType: 'motorcycle',
        vehiclePlate: '',
        status: 'offline',
        rating: 0,
        totalDeliveries: 0,
        cancelledDeliveries: 0,
        failedDeliveries: 0,
      };
      this.state.riders.push({ user: this.state.session?.user ?? this.state.customer, profile: r });
    }
    return r;
  }
  getRiderProfile(): RiderProfile {
    const s = this.getSession();
    return this.riderProfileFor(s.user.id);
  }
  updateRiderProfile(patch: { vehicleType?: VehicleType; vehiclePlate?: string; vehicleModel?: string; vehicleColor?: string; zone?: string }): RiderProfile {
    const p = this.getRiderProfile();
    Object.assign(p, patch);
    return p;
  }
  toggleRiderStatus(): RiderProfile {
    const p = this.getRiderProfile();
    if (p.status === 'on_trip') throw new ConflictError('Cannot change status while on a trip');
    p.status = p.status === 'online' ? 'offline' : 'online';
    return p;
  }
  setRiderStatus(status: RiderStatus): RiderProfile {
    const s = this.getSession();
    const p = this.getRiderProfile();
    if (status === 'online' && s.user.kycStatus !== 'approved') throw new ConflictError('Rider KYC not approved');
    if (p.status === 'on_trip' && status !== 'on_trip') throw new ConflictError('Cannot change status while on a trip');
    p.status = status;
    return p;
  }
  updateRiderLocation(latitude: number, longitude: number): RiderProfile {
    const p = this.getRiderProfile();
    p.currentLatitude = latitude;
    p.currentLongitude = longitude;
    p.lastLocationUpdate = nowIso();
    return p;
  }

  /* ---------------- dispatch ---------------- */
  board(): Delivery[] {
    const active: DeliveryStatus[] = ['requested', 'searching', 'assigned', 'picked_up', 'in_transit'];
    return this.state.deliveries.filter((d) => active.includes(d.status));
  }
  eligibleRiders(deliveryId: string): Array<{ rider: RiderProfile; distanceKm: number; estimatedTimeMinutes: number }> {
    const d = this.getDelivery(deliveryId);
    return this.state.riders
      .filter((r) => r.user.kycStatus === 'approved' && r.profile.status === 'online')
      .filter((r) => this.vehicleCompatible(r.profile.vehicleType, d.packageWeight))
      .map((r) => {
        const km = 3 + (r.profile.totalDeliveries % 5);
        return { rider: r.profile, distanceKm: km, estimatedTimeMinutes: Math.ceil(km * 2) };
      })
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }
  private vehicleCompatible(vehicle: VehicleType, weightKg: number): boolean {
    if (vehicle === 'motorcycle') return weightKg <= 10;
    if (vehicle === 'van') return weightKg <= 50;
    return weightKg <= 200;
  }
  assignRider(deliveryId: string, riderId: string): Delivery {
    const d = this.getDelivery(deliveryId);
    if (d.status !== 'searching' && d.status !== 'requested') throw new ConflictError('Delivery cannot be assigned in current status');
    const r = this.state.riders.find((x) => x.user.id === riderId);
    if (!r) throw new NotFoundError('Rider profile not found');
    if (r.user.kycStatus !== 'approved') throw new ConflictError('Rider KYC not approved');
    if (r.profile.status !== 'online') throw new ConflictError('Rider is not online');
    d.riderId = riderId;
    d.rider = r.user;
    r.profile.status = 'on_trip';
    this.transition(d, 'assigned', null, 'admin', 'Assigned by dispatcher');
    return d;
  }
  reassignRider(deliveryId: string, newRiderId: string, _reason: string): Delivery {
    const d = this.getDelivery(deliveryId);
    if (d.status !== 'assigned' && d.status !== 'picked_up') throw new ConflictError('Delivery cannot be reassigned in current status');
    if (d.riderId) {
      const old = this.state.riders.find((x) => x.user.id === d.riderId);
      if (old) old.profile.status = 'online';
    }
    d.status = 'searching';
    d.riderId = null;
    d.rider = null;
    return this.assignRider(deliveryId, newRiderId);
  }
  myQueue(): Delivery[] {
    const s = this.getSession();
    return this.state.deliveries.filter((d) => d.riderId === s.user.id && d.status === 'assigned');
  }
  acknowledge(deliveryId: string): Delivery {
    const s = this.getSession();
    const d = this.getDelivery(deliveryId);
    if (d.riderId !== s.user.id) throw new ConflictError('Not assigned to this delivery');
    if (d.status !== 'assigned') throw new ConflictError('Delivery not in ASSIGNED status');
    d.acknowledgedAt = nowIso();
    return d;
  }

  /* ---------------- execution ---------------- */
  pickup(deliveryId: string): Delivery {
    const s = this.getSession();
    const d = this.getDelivery(deliveryId);
    if (d.riderId !== s.user.id) throw new ConflictError('Not assigned to this delivery');
    return this.transition(d, 'picked_up', s.user.id, 'rider', 'Package picked up');
  }
  inTransit(deliveryId: string): Delivery {
    const s = this.getSession();
    const d = this.getDelivery(deliveryId);
    if (d.riderId !== s.user.id) throw new ConflictError('Not assigned to this delivery');
    return this.transition(d, 'in_transit', s.user.id, 'rider', 'Package in transit');
  }
  complete(deliveryId: string, proof: ProofInput): Delivery {
    const s = this.getSession();
    const d = this.getDelivery(deliveryId);
    if (d.riderId !== s.user.id) throw new ConflictError('Not assigned to this delivery');
    if (d.status !== 'in_transit') throw new ConflictError('Delivery must be IN_TRANSIT to complete');
    if (!proof.photoUrl || !proof.photoUrl.trim()) throw new ValidationError('Photo proof is required');
    if (!/^\d{6}$/.test(proof.recipientOtp)) throw new ValidationError('Valid 6-digit recipient OTP required');
    if (d.recipientCode && proof.recipientOtp !== d.recipientCode) throw new ConflictError('Recipient code does not match');
    this.state.podByDelivery[d.id] = {
      id: nextId('pod'),
      deliveryId: d.id,
      photoUrl: proof.photoUrl,
      recipientOtp: proof.recipientOtp,
      recipientName: proof.recipientName,
      recipientPhone: proof.recipientPhone,
      latitude: proof.latitude ?? null,
      longitude: proof.longitude ?? null,
      notes: proof.notes ?? null,
      createdAt: nowIso(),
    };
    const delivered = this.transition(d, 'delivered', s.user.id, 'rider', 'Delivered with proof');
    this.releaseRiderById(d.riderId, d.id);
    return delivered;
  }
  reportFailure(deliveryId: string, reason: string): Delivery {
    const s = this.getSession();
    const d = this.getDelivery(deliveryId);
    if (d.riderId !== s.user.id) throw new ConflictError('Not assigned to this delivery');
    if (d.status !== 'picked_up' && d.status !== 'in_transit') throw new ConflictError('Can only report failure from PICKED_UP or IN_TRANSIT status');
    if (!reason || !reason.trim()) throw new ValidationError('Failure reason is required');
    const next = statusAfterFailure(d.redeliveryAttempts);
    d.redeliveryAttempts += 1;
    d.failureReason = reason;
    // FAILED is not reachable via canTransition from IN_TRANSIT? it is. Handle both.
    d.status = next;
    this.pushEvent(d, next, s.user.id, 'rider', `Failed: ${reason}`);
    this.notify(d, next === 'returned' ? 'Returned to Sender' : 'Delivery Issue', `Delivery ${next}.`, 'sms');
    this.releaseRiderById(d.riderId, d.id);
    return d;
  }
  scheduleRedelivery(deliveryId: string): Delivery {
    const d = this.getDelivery(deliveryId);
    if (d.status !== 'failed') throw new ConflictError('Can only schedule redelivery for FAILED deliveries');
    if (d.redeliveryAttempts >= 2) throw new ConflictError('Maximum redelivery attempts reached');
    const previousRiderId = d.riderId;
    d.status = 'searching';
    d.riderId = null;
    d.rider = null;
    this.pushEvent(d, 'searching', null, 'admin', 'Redelivery scheduled');
    this.releaseRiderById(previousRiderId);
    return d;
  }

  /* ---------------- demo controls ---------------- */
  /** Advance a delivery one step along the happy path (for the demo menu). */
  advanceDelivery(deliveryId: string): Delivery {
    const d = this.getDelivery(deliveryId);
    switch (d.status) {
      case 'requested':
        d.status = 'searching';
        this.pushEvent(d, 'searching', null, 'admin', 'Payment confirmed (demo)');
        break;
      case 'searching': {
        const eligible = this.eligibleRiders(d.id)[0];
        if (eligible) this.assignRider(d.id, eligible.rider.userId);
        break;
      }
      case 'assigned':
        this.transition(d, 'picked_up', d.riderId, 'rider', 'Picked up (demo)');
        break;
      case 'picked_up':
        this.transition(d, 'in_transit', d.riderId, 'rider', 'In transit (demo)');
        break;
      case 'in_transit': {
        this.state.podByDelivery[d.id] = {
          id: nextId('pod'),
          deliveryId: d.id,
          photoUrl: 'file://demo-proof.jpg',
          recipientOtp: d.recipientCode ?? '482913',
          recipientName: d.recipientName,
          recipientPhone: d.recipientPhone,
          latitude: null,
          longitude: null,
          notes: 'Demo delivery',
          createdAt: nowIso(),
        };
        d.status = 'delivered';
        d.deliveredAt = nowIso();
        this.pushEvent(d, 'delivered', d.riderId, 'rider', 'Delivered (demo)');
        this.notify(d, 'Delivered', 'Demo delivery completed.', 'push');
        break;
      }
      case 'failed':
        d.status = 'searching';
        d.riderId = null;
        d.rider = null;
        this.pushEvent(d, 'searching', null, 'admin', 'Redelivery scheduled (demo)');
        break;
      default:
        break;
    }
    return d;
  }

  /** Recipient codes for the deliveries a presenter can complete POD on. */
  activeRecipientCodes(): Array<{ id: string; trackingNumber: string; status: DeliveryStatus; code: string }> {
    return this.state.deliveries
      .filter((d) => d.status === 'assigned' || d.status === 'picked_up' || d.status === 'in_transit')
      .map((d) => ({ id: d.id, trackingNumber: d.trackingNumber, status: d.status, code: d.recipientCode ?? '482913' }));
  }

  /* ---------------- admin ---------------- */
  listUsers(filter?: { role?: UserRole; isActive?: boolean }): User[] {
    const users: User[] = [this.state.customer, ...this.state.riders.map((r) => r.user)];
    return users.filter((u) => (!filter?.role || u.role === filter.role) && (filter?.isActive === undefined || u.isActive === filter.isActive));
  }
  getUser(id: string): User {
    const u = this.listUsers().find((x) => x.id === id);
    if (!u) throw new NotFoundError('User not found');
    return u;
  }
  updateKycStatus(userId: string, status: 'pending' | 'approved' | 'rejected', reason?: string): User {
    const u = this.getUser(userId);
    u.kycStatus = status;
    if (reason) u.kycRejectionReason = reason;
    return u;
  }
  toggleActive(userId: string): User {
    const u = this.getUser(userId);
    u.isActive = !u.isActive;
    return u;
  }
  pendingKyc(): unknown[] {
    return this.state.riders
      .filter((r) => r.user.kycStatus === 'pending')
      .map((r) => ({ userId: r.user.id, user: r.user, status: 'pending' }));
  }
  approveKyc(userId: string): unknown {
    this.updateKycStatus(userId, 'approved');
    return { userId, status: 'approved' };
  }
  rejectKyc(userId: string, reason: string): unknown {
    if (!reason || !reason.trim()) throw new ValidationError('Rejection reason is required');
    this.updateKycStatus(userId, 'rejected', reason);
    return { userId, status: 'rejected' };
  }
  allIssues(filter?: { status?: IssueStatus; priority?: string }): Issue[] {
    return this.state.issues.filter((i) => (!filter?.status || i.status === filter.status) && (!filter?.priority || i.priority === filter.priority));
  }
  assignIssue(id: string, assignedToId: string): Issue {
    const i = this.getIssue(id);
    i.assignedToId = assignedToId;
    i.status = 'in_progress';
    return i;
  }
}
