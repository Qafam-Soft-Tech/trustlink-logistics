import { DataSource } from 'typeorm';

let testDataSource: DataSource;

export default async function globalSetup() {
  testDataSource = new DataSource({
    type: 'sqlite',
    database: ':memory:',
    entities: [__dirname + '/../src/**/*.entity{.ts,.js}'],
    synchronize: true,
    logging: false,
  });

  await testDataSource.initialize();
  global.__TEST_DATA_SOURCE__ = testDataSource;
}

export default async function globalTeardown() {
  const testDataSource = global.__TEST_DATA_SOURCE__;
  if (testDataSource && testDataSource.isInitialized) {
    await testDataSource.destroy();
  }
}