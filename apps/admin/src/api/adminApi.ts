import { api } from '../utils/api';

export interface ApiUser {
  id: string;
  phone: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  role: 'customer' | 'rider' | 'admin';
  kycStatus?: 'pending' | 'approved' | 'rejected' | null;
  isActive: boolean;
  createdAt: string;
}

export interface ApiRiderProfile {
  id: string;
  userId: string;
  vehicleType: 'motorcycle' | 'van' | 'truck';
  vehiclePlate: string;
  vehicleModel?: string | null;
  vehicleColor?: string | null;
  zone?: string | null;
  status: 'online' | 'offline' | 'on_trip';
  rating: number;
  totalDeliveries: number;
  currentLatitude?: number | null;
  currentLongitude?: number | null;
}

export interface ApiKyc {
  id: string;
  userId: string;
  nin?: string | null;
  idType?: string | null;
  idFrontUrl?: string | null;
  idBackUrl?: string | null;
  selfieUrl?: string | null;
  vehicleRegistrationUrl?: string | null;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string | null;
}

export interface ApiDeliveryEvent {
  id: string;
  status: string;
  actorRole?: string | null;
  notes?: string | null;
  createdAt: string;
}

export interface ApiDelivery {
  id: string;
  trackingNumber: string;
  customerId: string;
  riderId: string | null;
  customer?: ApiUser | null;
  rider?: ApiUser | null;
  pickupStreet: string;
  pickupArea?: string | null;
  dropoffStreet: string;
  dropoffArea?: string | null;
  packageType: 'document' | 'parcel';
  packageWeight: number | string;
  packageDescription?: string | null;
  senderName: string;
  senderPhone: string;
  recipientName: string;
  recipientPhone: string;
  status: string;
  fare?: number | string | null;
  paymentReference?: string | null;
  redeliveryAttempts: number;
  createdAt: string;
  updatedAt?: string;
  events?: ApiDeliveryEvent[];
}

export interface ApiPayment {
  id: string;
  deliveryId: string;
  reference: string;
  status: 'pending' | 'processing' | 'success' | 'failed' | 'cancelled' | 'refunded';
}

export interface ApiIssue {
  id: string;
  deliveryId: string;
  reporterId: string;
  reporter?: ApiUser | null;
  type: string;
  priority: string;
  title: string;
  description: string;
  status: string;
  assignedToId?: string | null;
  resolution?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface ApiPricingConfig {
  key: string;
  value: number | string;
  description?: string | null;
}

export interface ApiReportSummary {
  totals: { deliveries: number; delivered: number; cancelled: number; returned: number; active: number };
  rates: { completionRate: number; cancellationRate: number };
  revenue: number;
  deliveriesPerDay: Array<{ date: string; deliveries: number }>;
}

export interface ApiRiderRecord {
  user: ApiUser;
  profile: ApiRiderProfile;
  kyc: ApiKyc | null;
}

export const adminApi = {
  login: (email: string, password: string) =>
    api.post<{ user: ApiUser; token: string }>('/auth/admin/login', { email, password }).then((response) => response.data),

  riders: () => api.get<ApiRiderRecord[]>('/admin/riders').then((response) => response.data),
  deliveries: () => api.get<ApiDelivery[]>('/deliveries/all').then((response) => response.data),
  payments: () => api.get<ApiPayment[]>('/payments').then((response) => response.data),
  users: (role?: string) => api.get<ApiUser[]>('/users', { params: { role } }).then((response) => response.data),
  issues: () => api.get<ApiIssue[]>('/issues/all').then((response) => response.data),
  pricing: () => api.get<ApiPricingConfig[]>('/pricing/config').then((response) => response.data),

  assignRider: (deliveryId: string, riderId: string) =>
    api.put(`/dispatch/${deliveryId}/assign`, { riderId }).then((response) => response.data),
  reassignRider: (deliveryId: string, newRiderId: string, reason: string) =>
    api.put(`/dispatch/${deliveryId}/reassign`, { newRiderId, reason }).then((response) => response.data),
  scheduleRedelivery: (deliveryId: string) =>
    api.post(`/deliveries/${deliveryId}/redelivery`).then((response) => response.data),

  approveKyc: (userId: string) => api.put(`/kyc/${userId}/approve`).then((response) => response.data),
  rejectKyc: (userId: string, reason: string) =>
    api.put(`/kyc/${userId}/reject`, { reason }).then((response) => response.data),

  toggleUserActive: (userId: string) =>
    api.put(`/users/${userId}/toggle-active`).then((response) => response.data),

  assignIssue: (issueId: string, assignedToId: string) =>
    api.put(`/issues/${issueId}/assign`, { assignedToId }).then((response) => response.data),
  updateIssueStatus: (issueId: string, status: string, resolution?: string) =>
    api.put(`/issues/${issueId}/status`, { status, resolution }).then((response) => response.data),

  updatePricing: (key: string, value: number) =>
    api.put(`/pricing/config/${key}`, { value }).then((response) => response.data),

  reports: () => api.get<ApiReportSummary>('/admin/reports/summary').then((response) => response.data),
};
