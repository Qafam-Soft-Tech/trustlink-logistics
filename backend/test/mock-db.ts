import * as crypto from 'crypto';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

import { UserRole, KycStatus } from '../src/modules/auth/entities/user.entity';
import { DeliveryStatus, PackageType } from '../src/modules/deliveries/entities/delivery.entity';
import { VehicleType, RiderStatus } from '../src/modules/deliveries/entities/rider-profile.entity';
import { PricingConfigKey, DEFAULT_PRICING_CONFIG } from '../src/modules/payments/entities/pricing-config.entity';
import { NotificationService } from '../src/modules/notifications/services/notification.service';

const ENTITY_NAMES = [
  'User',
  'OtpCode',
  'Delivery',
  'Address',
  'DeliveryEvent',
  'ProofOfDelivery',
  'RiderProfile',
  'KycSubmission',
  'PricingConfig',
  'Payment',
  'Notification',
  'Issue',
];

// Maps a relation property (e.g. `delivery` from `deliveryId`) to its entity store.
const RELATION_STORE: Record<string, string> = {
  delivery: 'Delivery',
  customer: 'User',
  rider: 'User',
  user: 'User',
  reporter: 'User',
  assignedTo: 'User',
};

function matchItem(item: any, where: Record<string, any>): boolean {
  if (!where) return true;
  return Object.entries(where).every(([key, value]) => item[key] === value);
}

function resolvePath(item: any, path: string): any {
  let current = item;
  for (const part of path.split('.')) {
    if (current == null) return undefined;
    current = current[part];
  }
  return current;
}

function sortItems(items: any[], order: Record<string, 'ASC' | 'DESC'>): any[] {
  return [...items].sort((a, b) => {
    for (const [key, dir] of Object.entries(order)) {
      const av = a[key];
      const bv = b[key];
      let cmp = 0;
      if (av == null && bv == null) cmp = 0;
      else if (av == null) cmp = 1;
      else if (bv == null) cmp = -1;
      else cmp = av < bv ? -1 : av > bv ? 1 : 0;
      if (cmp !== 0) return dir === 'DESC' ? -cmp : cmp;
    }
    return 0;
  });
}

function normalizeCriteria(criteria: any): Record<string, any> {
  if (typeof criteria === 'string' || typeof criteria === 'number') {
    return { id: criteria };
  }
  return criteria || {};
}

export class MockDb {
  private stores = new Map<string, any[]>();

  constructor() {
    ENTITY_NAMES.forEach(name => this.stores.set(name, []));
  }

  store(name: string): any[] {
    const existing = this.stores.get(name);
    if (existing) return existing;
    const arr: any[] = [];
    this.stores.set(name, arr);
    return arr;
  }

  all(name: string): any[] {
    return this.store(name);
  }

  get(name: string, id: string): any | null {
    return this.store(name).find(item => item.id === id) ?? null;
  }

  clear(name: string): void {
    this.store(name).length = 0;
  }

  reset(): void {
    ENTITY_NAMES.forEach(name => {
      this.store(name).length = 0;
    });
  }

  private attachRelation(entity: Record<string, any>, key: string): void {
    if (!key.endsWith('Id')) return;
    const relName = key.slice(0, -2);
    if (entity[relName] && typeof entity[relName] === 'object') return;
    const storeName = RELATION_STORE[relName];
    if (!storeName) return;
    const target = this.store(storeName).find(item => item.id === entity[key]);
    if (target) entity[relName] = target;
  }

  attachFks(entity: any): any {
    if (Array.isArray(entity)) {
      entity.forEach(item => this.attachFks(item));
      return entity;
    }
    if (entity && typeof entity === 'object') {
      Object.keys(entity).forEach(key => this.attachRelation(entity, key));
    }
    return entity;
  }

  saveEntity(name: string, data: any): any {
    if (Array.isArray(data)) return data.map(item => this.saveEntity(name, item));
    if (!data.id) data.id = crypto.randomUUID();
    const arr = this.store(name);
    const idx = arr.findIndex(item => item.id === data.id);
    if (idx >= 0) arr[idx] = data;
    else arr.push(data);
    this.attachFks(data);
    return data;
  }

  add(name: string, item: any): any {
    return this.saveEntity(name, item);
  }

  repo(name: string): MockRepository {
    return new MockRepository(name, this);
  }

  provider(entityClass: any): Record<string, any> {
    return { provide: getRepositoryToken(entityClass), useValue: this.repo(entityClass.name) };
  }

  providers(classes: any[]): Array<Record<string, any>> {
    return classes.map(entityClass => this.provider(entityClass));
  }
}

export class MockRepository {
  constructor(private readonly name: string, private readonly db: MockDb) {}

  create(data: any = {}): any {
    return { ...data };
  }

  async save(entity: any): Promise<any> {
    return this.db.saveEntity(this.name, entity);
  }

  async findOne(options: any = {}): Promise<any> {
    const where = options?.where ?? {};
    return this.db.store(this.name).find(item => matchItem(item, where)) ?? null;
  }

  async find(options: any = {}): Promise<any[]> {
    let items = this.db.store(this.name).filter(item => matchItem(item, options?.where ?? {}));
    if (options?.order) {
      items = sortItems(items, options.order);
    }
    if (options?.take) {
      items = items.slice(0, options.take);
    }
    return items;
  }

  async count(options: any = {}): Promise<number> {
    return this.db.store(this.name).filter(item => matchItem(item, options?.where ?? {})).length;
  }

  async update(criteria: any, partial: any): Promise<{ affected: number }> {
    const where = normalizeCriteria(criteria);
    let affected = 0;
    for (const item of this.db.store(this.name)) {
      if (matchItem(item, where)) {
        Object.assign(item, partial);
        affected++;
      }
    }
    return { affected };
  }

  async delete(criteria: any): Promise<{ affected: number }> {
    const where = normalizeCriteria(criteria);
    const items = this.db.store(this.name);
    const keep = items.filter(item => !matchItem(item, where));
    const affected = items.length - keep.length;
    items.length = 0;
    items.push(...keep);
    return { affected };
  }

  async remove(entity: any): Promise<any> {
    if (!entity || entity.id == null) {
      await this.delete({});
      return entity;
    }
    await this.delete(entity.id);
    return entity;
  }

  createQueryBuilder(alias: string): MockQueryBuilder {
    return new MockQueryBuilder(alias, this.db.store(this.name));
  }
}

export class MockQueryBuilder {
  private conditions: Array<(item: any) => boolean> = [];
  private order: Array<[string, 'ASC' | 'DESC']> = [];

  constructor(private readonly alias: string, private readonly source: any[]) {}

  where(cond?: string, params?: Record<string, any>): MockQueryBuilder {
    this.addCondition(cond, params);
    return this;
  }

  andWhere(cond?: string, params?: Record<string, any>): MockQueryBuilder {
    this.addCondition(cond, params);
    return this;
  }

  leftJoinAndSelect(): MockQueryBuilder {
    return this;
  }

  orderBy(field?: string, dir: 'ASC' | 'DESC' = 'ASC'): MockQueryBuilder {
    if (field) this.order.push([this.fieldPath(field), dir]);
    return this;
  }

  private fieldPath(field: string): string {
    const parts = field.split('.');
    if (parts[0] === this.alias) parts.shift();
    return parts.join('.');
  }

  private addCondition(cond?: string, params: Record<string, any> = {}): void {
    if (!cond) {
      this.conditions.push(() => true);
      return;
    }

    const inMatch = cond.match(/([\w.]+)\s+IN\s*\(\s*:\.\.\.(\w+)\s*\)/i);
    if (inMatch) {
      const path = this.fieldPath(inMatch[1]);
      const values: any[] = params[inMatch[2]] || [];
      this.conditions.push(item => values.includes(resolvePath(item, path)));
      return;
    }

    const likeMatch = cond.match(/([\w.]+)\s+LIKE\s+:(\w+)/i);
    if (likeMatch) {
      const path = this.fieldPath(likeMatch[1]);
      const pattern: string = params[likeMatch[2]] || '';
      const needle = pattern.replace(/%/g, '').toLowerCase();
      this.conditions.push(item => {
        const value = resolvePath(item, path);
        return value != null && String(value).toLowerCase().includes(needle);
      });
      return;
    }

    const eqMatch = cond.match(/([\w.]+)\s*=\s*:(\w+)/);
    if (eqMatch) {
      const path = this.fieldPath(eqMatch[1]);
      const value = params[eqMatch[2]];
      this.conditions.push(item => resolvePath(item, path) === value);
      return;
    }

    this.conditions.push(() => true);
  }

  private execute(): any[] {
    let items = this.source.filter(item => this.conditions.every(fn => fn(item)));
    for (const [path, dir] of this.order) {
      items = sortItems(items, { [path]: dir });
    }
    return items;
  }

  async getMany(): Promise<any[]> {
    return this.execute();
  }

  async getOne(): Promise<any | null> {
    return this.execute()[0] ?? null;
  }
}

export const TestFactory = {
  createCustomer(overrides: any = {}) {
    return {
      id: crypto.randomUUID(),
      phone: '08012345678',
      email: 'customer@test.com',
      firstName: 'John',
      lastName: 'Doe',
      role: UserRole.CUSTOMER,
      passwordHash: 'hashed',
      kycStatus: KycStatus.PENDING,
      isActive: true,
      isPhoneVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  },

  createRider(overrides: any = {}) {
    return {
      id: crypto.randomUUID(),
      phone: '08087654321',
      email: 'rider@test.com',
      firstName: 'Mike',
      lastName: 'Johnson',
      role: UserRole.RIDER,
      passwordHash: 'hashed',
      kycStatus: KycStatus.APPROVED,
      isActive: true,
      isPhoneVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  },

  createAdmin(overrides: any = {}) {
    return {
      id: crypto.randomUUID(),
      phone: '08011111111',
      email: 'admin@test.com',
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
      passwordHash: 'hashed',
      kycStatus: KycStatus.APPROVED,
      isActive: true,
      isPhoneVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  },

  createDelivery(overrides: any = {}) {
    return {
      id: crypto.randomUUID(),
      trackingNumber: `TLK-${Date.now()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      customerId: '',
      riderId: null,
      pickupStreet: '123 Ahmadu Bello Way',
      pickupLandmark: 'Near Shoprite',
      pickupArea: 'Wuse 2',
      pickupLatitude: 9.0579,
      pickupLongitude: 7.4891,
      dropoffStreet: '456 Shehu Shagari Way',
      dropoffLandmark: 'Opposite Transcorp',
      dropoffArea: 'Maitama',
      dropoffLatitude: 9.0723,
      dropoffLongitude: 7.4912,
      packageType: PackageType.DOCUMENT,
      packageWeight: 0.5,
      packageDescription: 'Legal documents',
      senderName: 'John Doe',
      senderPhone: '08012345678',
      recipientName: 'Jane Smith',
      recipientPhone: '08087654321',
      status: DeliveryStatus.REQUESTED,
      redeliveryAttempts: 0,
      fare: 1500,
      paymentReference: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      events: [],
      ...overrides,
    };
  },

  createRiderProfile(overrides: any = {}) {
    return {
      id: crypto.randomUUID(),
      userId: '',
      vehicleType: VehicleType.MOTORCYCLE,
      vehiclePlate: 'ABC 123 XY',
      vehicleModel: 'Honda CG 125',
      vehicleColor: 'Red',
      zone: 'Wuse',
      status: RiderStatus.ONLINE,
      currentLatitude: 9.0579,
      currentLongitude: 7.4891,
      lastLocationUpdate: new Date(),
      rating: 4.9,
      totalDeliveries: 156,
      cancelledDeliveries: 2,
      failedDeliveries: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  },

  createKycSubmission(overrides: any = {}) {
    return {
      id: crypto.randomUUID(),
      userId: '',
      nin: '12345678901',
      idType: 'nin',
      status: KycStatus.PENDING,
      createdAt: new Date(),
      ...overrides,
    };
  },

  createPricingConfig(key: PricingConfigKey, overrides: any = {}) {
    const defaults = DEFAULT_PRICING_CONFIG[key];
    return {
      id: crypto.randomUUID(),
      key,
      value: defaults.value,
      description: defaults.description,
      ...overrides,
    };
  },
};

export function seedPricingConfigs(db: MockDb): void {
  Object.keys(DEFAULT_PRICING_CONFIG).forEach(key => {
    db.add('PricingConfig', TestFactory.createPricingConfig(key as PricingConfigKey));
  });
}

export function seedBaseData(db: MockDb): { customer: any; rider: any; admin: any; riderProfile: any } {
  const customer = TestFactory.createCustomer({ id: 'customer-1' });
  const rider = TestFactory.createRider({ id: 'rider-1' });
  const admin = TestFactory.createAdmin({ id: 'admin-1' });

  db.add('User', customer);
  db.add('User', rider);
  db.add('User', admin);

  const riderProfile = TestFactory.createRiderProfile({ id: 'rider-profile-1', userId: rider.id });
  db.add('RiderProfile', riderProfile);

  seedPricingConfigs(db);

  return { customer, rider, admin, riderProfile };
}

export const configServiceMock: Record<string, any> = {
  provide: ConfigService,
  useValue: {
    get: () => '',
  },
};

export const notificationServiceMock: Record<string, any> = {
  provide: NotificationService,
  useValue: {
    notifyDeliveryStatusChange: jest.fn(async () => undefined),
  },
};