import { Test, TestingModule } from '@nestjs/testing';

import { Delivery, DeliveryEvent, DeliveryStatus, Address } from '../src/modules/deliveries/entities/delivery.entity';
import { ProofOfDelivery } from '../src/modules/deliveries/entities/proof-of-delivery.entity';
import { RiderProfile, RiderStatus } from '../src/modules/deliveries/entities/rider-profile.entity';
import { User } from '../src/modules/auth/entities/user.entity';
import { DeliveryService } from '../src/modules/deliveries/services/delivery.service';
import { MockDb, TestFactory, seedBaseData, notificationServiceMock } from './mock-db';

describe('M1: rider release and timeline persistence', () => {
  let module: TestingModule;
  let db: MockDb;
  let deliveryService: DeliveryService;
  let deliveryRepository: any;
  let riderProfileRepository: any;
  let testData: any;

  beforeAll(async () => {
    db = new MockDb();
    testData = seedBaseData(db);

    deliveryRepository = db.repo('Delivery');
    riderProfileRepository = db.repo('RiderProfile');

    module = await Test.createTestingModule({
      providers: [
        DeliveryService,
        ...db.providers([Delivery, Address, DeliveryEvent, ProofOfDelivery, RiderProfile, User]),
        notificationServiceMock,
      ],
    }).compile();

    deliveryService = module.get<DeliveryService>(DeliveryService);
  });

  afterAll(async () => {
    await module.close();
  });

  const putRiderOnTrip = async () => {
    const profile = await riderProfileRepository.findOne({ where: { userId: testData.rider.id } });
    profile.status = RiderStatus.ON_TRIP;
    await riderProfileRepository.save(profile);
  };

  const riderStatus = async () => {
    const profile = await riderProfileRepository.findOne({ where: { userId: testData.rider.id } });
    return profile.status;
  };

  it('frees the rider after a successful delivery and persists the DELIVERED event', async () => {
    await putRiderOnTrip();
    const delivery = await deliveryRepository.save(
      TestFactory.createDelivery({
        customerId: testData.customer.id,
        riderId: testData.rider.id,
        status: DeliveryStatus.IN_TRANSIT,
      }),
    );

    await deliveryService.completeDelivery(delivery.id, testData.rider.id, {
      photoUrl: 'https://example.com/proof.jpg',
      recipientOtp: '123456',
      recipientName: 'Jane Smith',
      recipientPhone: '08087654321',
    });

    expect(await riderStatus()).toBe(RiderStatus.ONLINE);
    const events = db.all('DeliveryEvent').filter(event => event.deliveryId === delivery.id);
    expect(events.some(event => event.status === DeliveryStatus.DELIVERED)).toBe(true);
  });

  it('frees the rider after a failed attempt', async () => {
    await putRiderOnTrip();
    const delivery = await deliveryRepository.save(
      TestFactory.createDelivery({
        customerId: testData.customer.id,
        riderId: testData.rider.id,
        status: DeliveryStatus.IN_TRANSIT,
        redeliveryAttempts: 0,
      }),
    );

    await deliveryService.reportFailure(delivery.id, testData.rider.id, 'Recipient unavailable');

    expect(await riderStatus()).toBe(RiderStatus.ONLINE);
  });

  it('frees the rider when a redelivery is scheduled', async () => {
    await putRiderOnTrip();
    const delivery = await deliveryRepository.save(
      TestFactory.createDelivery({
        customerId: testData.customer.id,
        riderId: testData.rider.id,
        status: DeliveryStatus.FAILED,
        redeliveryAttempts: 1,
      }),
    );

    await deliveryService.scheduleRedelivery(delivery.id, testData.admin.id);

    expect(await riderStatus()).toBe(RiderStatus.ONLINE);
    const updated = await deliveryRepository.findOne({ where: { id: delivery.id } });
    expect(updated.riderId).toBeNull();
    expect(updated.status).toBe(DeliveryStatus.SEARCHING);
  });
});
