import { Test, TestingModule } from '@nestjs/testing';
import { Delivery, DeliveryEvent, DeliveryStatus, PackageType, Address } from '../src/modules/deliveries/entities/delivery.entity';
import { ProofOfDelivery } from '../src/modules/deliveries/entities/proof-of-delivery.entity';
import { RiderProfile } from '../src/modules/deliveries/entities/rider-profile.entity';
import { User } from '../src/modules/auth/entities/user.entity';
import { Issue, IssueType, IssuePriority } from '../src/modules/deliveries/entities/issue.entity';
import { DeliveryService } from '../src/modules/deliveries/services/delivery.service';
import { IssueService } from '../src/modules/deliveries/services/issue.service';
import { MockDb, TestFactory, seedBaseData, notificationServiceMock } from './mock-db';

describe('Phase 10: History, Receipts & Support Flag', () => {
  let module: TestingModule;
  let db: MockDb;
  let issueService: IssueService;
  let deliveryService: DeliveryService;
  let deliveryRepository: any;
  let userRepository: any;
  let proofOfDeliveryRepository: any;
  let testData: any;

  beforeAll(async () => {
    db = new MockDb();
    testData = seedBaseData(db);

    deliveryRepository = db.repo('Delivery');
    userRepository = db.repo('User');
    proofOfDeliveryRepository = db.repo('ProofOfDelivery');

    module = await Test.createTestingModule({
      providers: [
        IssueService,
        DeliveryService,
        ...db.providers([Issue, Delivery, DeliveryEvent, ProofOfDelivery, Address, RiderProfile, User]),
        notificationServiceMock,
      ],
    }).compile();

    issueService = module.get<IssueService>(IssueService);
    deliveryService = module.get<DeliveryService>(DeliveryService);
  });

  afterAll(async () => {
    await module.close();
  });

  describe('Delivery History Scoping', () => {
    it('should return only customer\'s own deliveries', async () => {
      const delivery1 = await deliveryService.createDelivery(testData.customer.id, {
        pickupStreet: '123 Street',
        dropoffStreet: '456 Avenue',
        packageType: PackageType.DOCUMENT,
        packageWeight: 0.5,
        senderName: 'John',
        senderPhone: '08012345678',
        recipientName: 'Jane',
        recipientPhone: '08087654321',
      });

      const delivery2 = await deliveryService.createDelivery(testData.customer.id, {
        pickupStreet: '789 Street',
        dropoffStreet: '012 Avenue',
        packageType: PackageType.PARCEL,
        packageWeight: 1,
        senderName: 'John',
        senderPhone: '08012345678',
        recipientName: 'Bob',
        recipientPhone: '08011111111',
      });

      // Create delivery for different customer
      const otherCustomer = userRepository.create(TestFactory.createCustomer({ phone: '08099999999', id: 'other-customer' }));
      await userRepository.save(otherCustomer);
      await deliveryService.createDelivery(otherCustomer.id, {
        pickupStreet: 'Other Street',
        dropoffStreet: 'Other Avenue',
        packageType: PackageType.DOCUMENT,
        packageWeight: 0.5,
        senderName: 'Other',
        senderPhone: '08099999999',
        recipientName: 'Recipient',
        recipientPhone: '08000000000',
      });

      const customerDeliveries = await deliveryService.getCustomerDeliveries(testData.customer.id);
      expect(customerDeliveries.length).toBe(2);
      expect(customerDeliveries.every((d: any) => d.customerId === testData.customer.id)).toBe(true);
      expect(delivery1.id).toBeDefined();
      expect(delivery2.id).toBeDefined();
    });

    it('should return only rider\'s assigned deliveries', async () => {
      const delivery = await deliveryService.createDelivery(testData.customer.id, {
        pickupStreet: '123 Street',
        dropoffStreet: '456 Avenue',
        packageType: PackageType.DOCUMENT,
        packageWeight: 0.5,
        senderName: 'John',
        senderPhone: '08012345678',
        recipientName: 'Jane',
        recipientPhone: '08087654321',
      });

      await deliveryRepository.update(delivery.id, {
        status: DeliveryStatus.ASSIGNED,
        riderId: testData.rider.id,
      });

      const riderDeliveries = await deliveryService.getRiderDeliveries(testData.rider.id);
      expect(riderDeliveries.length).toBe(1);
      expect(riderDeliveries[0].riderId).toBe(testData.rider.id);
    });

    it('should not leak cross-user delivery data', async () => {
      const otherRider = userRepository.create(TestFactory.createRider({ phone: '08099999999', id: 'rider-other' }));
      otherRider.kycStatus = 'approved';
      await userRepository.save(otherRider);

      const delivery = await deliveryService.createDelivery(testData.customer.id, {
        pickupStreet: '123 Street',
        dropoffStreet: '456 Avenue',
        packageType: PackageType.DOCUMENT,
        packageWeight: 0.5,
        senderName: 'John',
        senderPhone: '08012345678',
        recipientName: 'Jane',
        recipientPhone: '08087654321',
      });
      await deliveryRepository.update(delivery.id, {
        status: DeliveryStatus.ASSIGNED,
        riderId: testData.rider.id,
      });

      // Other rider should not see this delivery
      const otherRiderDeliveries = await deliveryService.getRiderDeliveries(otherRider.id);
      expect(otherRiderDeliveries.length).toBe(0);
    });
  });

  describe('Proof of Delivery Visibility', () => {
    it('should only be visible for DELIVERED orders', async () => {
      const delivery = await deliveryRepository.save({
        ...TestFactory.createDelivery({
          customerId: testData.customer.id,
          status: DeliveryStatus.IN_TRANSIT,
          riderId: testData.rider.id,
        }),
      });

      const proof = await proofOfDeliveryRepository.save({
        deliveryId: delivery.id,
        photoUrl: 'https://example.com/proof.jpg',
        recipientOtp: '123456',
        recipientName: 'Jane',
        recipientPhone: '08087654321',
      });

      // Should not be visible for non-DELIVERED
      const retrieved = await deliveryService.getProofOfDelivery(delivery.id);
      expect(retrieved).toBeNull();

      // Update to DELIVERED
      await deliveryRepository.update(delivery.id, { status: DeliveryStatus.DELIVERED });
      const visible = await deliveryService.getProofOfDelivery(delivery.id);
      expect(visible).toBeDefined();
      expect(visible.id).toBe(proof.id);
    });
  });

  describe('Issue Reporting', () => {
    it('should allow customer to report issue for their delivery', async () => {
      const delivery = await deliveryRepository.save({
        ...TestFactory.createDelivery({ customerId: testData.customer.id }),
      });

      const issue = await issueService.createIssue(testData.customer.id, {
        deliveryId: delivery.id,
        type: IssueType.DELIVERY_ISSUE,
        priority: IssuePriority.HIGH,
        title: 'Package damaged',
        description: 'Package arrived with torn packaging',
        attachments: ['https://example.com/photo1.jpg'],
      });

      expect(issue.id).toBeDefined();
      expect(issue.reporterId).toBe(testData.customer.id);
      expect(issue.deliveryId).toBe(delivery.id);
      expect(issue.status).toBe('open');
    });

    it('should allow rider to report issue for their delivery', async () => {
      const delivery = await deliveryRepository.save({
        ...TestFactory.createDelivery({
          customerId: testData.customer.id,
          riderId: testData.rider.id,
        }),
      });

      const issue = await issueService.createIssue(testData.rider.id, {
        deliveryId: delivery.id,
        type: IssueType.RIDER_ISSUE,
        priority: IssuePriority.MEDIUM,
        title: 'Customer not at address',
        description: 'Customer not home at dropoff location',
      });

      expect(issue.reporterId).toBe(testData.rider.id);
    });

    it('should reject issue for delivery not belonging to user', async () => {
      const otherCustomer = userRepository.create(TestFactory.createCustomer({ phone: '08099999999', id: 'other-customer' }));
      await userRepository.save(otherCustomer);

      const delivery = await deliveryRepository.save({
        ...TestFactory.createDelivery({ customerId: otherCustomer.id }),
      });

      await expect(issueService.createIssue(testData.customer.id, {
        deliveryId: delivery.id,
        type: IssueType.DELIVERY_ISSUE,
        priority: IssuePriority.LOW,
        title: 'Test',
        description: 'Test',
      })).rejects.toThrow('You can only report issues for your own deliveries');
    });

    it('should return only user\'s own issues', async () => {
      db.clear('Issue');

      const delivery1 = await deliveryRepository.save({
        ...TestFactory.createDelivery({ customerId: testData.customer.id }),
      });
      const delivery2 = await deliveryRepository.save({
        ...TestFactory.createDelivery({ customerId: testData.customer.id }),
      });

      await issueService.createIssue(testData.customer.id, {
        deliveryId: delivery1.id,
        type: IssueType.DELIVERY_ISSUE,
        priority: IssuePriority.LOW,
        title: 'Issue 1',
        description: 'Desc 1',
      });

      await issueService.createIssue(testData.customer.id, {
        deliveryId: delivery2.id,
        type: IssueType.PAYMENT_ISSUE,
        priority: IssuePriority.HIGH,
        title: 'Issue 2',
        description: 'Desc 2',
      });

      const issues = await issueService.getUserIssues(testData.customer.id);
      expect(issues.length).toBe(2);
      expect(issues.every((i: any) => i.reporterId === testData.customer.id)).toBe(true);
    });

    it('should allow admin to see all issues', async () => {
      const otherCustomer = userRepository.create(TestFactory.createCustomer({ phone: '08099999999', id: 'other-customer' }));
      await userRepository.save(otherCustomer);

      const delivery = await deliveryRepository.save({
        ...TestFactory.createDelivery({ customerId: otherCustomer.id }),
      });

      await issueService.createIssue(otherCustomer.id, {
        deliveryId: delivery.id,
        type: IssueType.DELIVERY_ISSUE,
        priority: IssuePriority.LOW,
        title: 'Other issue',
        description: 'Desc',
      });

      const allIssues = await issueService.getAllIssues();
      expect(allIssues.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Issue Status Transitions', () => {
    it('should allow admin to assign issue', async () => {
      const delivery = await deliveryRepository.save({
        ...TestFactory.createDelivery({ customerId: testData.customer.id }),
      });

      const issue = await issueService.createIssue(testData.customer.id, {
        deliveryId: delivery.id,
        type: IssueType.DELIVERY_ISSUE,
        priority: IssuePriority.HIGH,
        title: 'Test',
        description: 'Test',
      });

      const updated = await issueService.assignIssue(issue.id, testData.admin.id, testData.admin.id);
      expect(updated.assignedToId).toBe(testData.admin.id);
      expect(updated.status).toBe('in_progress');
    });

    it('should allow reporter to resolve their issue', async () => {
      const delivery = await deliveryRepository.save({
        ...TestFactory.createDelivery({ customerId: testData.customer.id }),
      });

      const issue = await issueService.createIssue(testData.customer.id, {
        deliveryId: delivery.id,
        type: IssueType.DELIVERY_ISSUE,
        priority: IssuePriority.LOW,
        title: 'Test',
        description: 'Test',
      });

      const updated = await issueService.updateIssueStatus(issue.id, testData.customer.id, 'resolved', 'Resolved by customer');
      expect(updated.status).toBe('resolved');
      expect(updated.resolution).toBe('Resolved by customer');
      expect(updated.resolvedAt).toBeDefined();
    });

    it('should allow assignee to resolve issue', async () => {
      const delivery = await deliveryRepository.save({
        ...TestFactory.createDelivery({ customerId: testData.customer.id }),
      });

      const issue = await issueService.createIssue(testData.customer.id, {
        deliveryId: delivery.id,
        type: IssueType.DELIVERY_ISSUE,
        priority: IssuePriority.HIGH,
        title: 'Test',
        description: 'Test',
      });

      await issueService.assignIssue(issue.id, testData.admin.id, testData.admin.id);
      const updated = await issueService.updateIssueStatus(issue.id, testData.admin.id, 'resolved', 'Fixed');
      expect(updated.status).toBe('resolved');
    });

    it('should prevent unauthorized status updates', async () => {
      const otherCustomer = userRepository.create(TestFactory.createCustomer({ phone: '08099999999', id: 'other-customer' }));
      await userRepository.save(otherCustomer);

      const delivery = await deliveryRepository.save({
        ...TestFactory.createDelivery({ customerId: testData.customer.id }),
      });

      const issue = await issueService.createIssue(testData.customer.id, {
        deliveryId: delivery.id,
        type: IssueType.DELIVERY_ISSUE,
        priority: IssuePriority.LOW,
        title: 'Test',
        description: 'Test',
      });

      await expect(issueService.updateIssueStatus(issue.id, otherCustomer.id, 'resolved'))
        .rejects.toThrow('You can only update your own issues');
    });
  });
});