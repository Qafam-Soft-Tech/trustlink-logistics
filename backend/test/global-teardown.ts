import { DataSource } from 'typeorm';

let testDataSource: DataSource;

export default async function globalTeardown() {
  const testDataSource = global.__TEST_DATA_SOURCE__;
  if (testDataSource && testDataSource.isInitialized) {
    await testDataSource.destroy();
  }
}