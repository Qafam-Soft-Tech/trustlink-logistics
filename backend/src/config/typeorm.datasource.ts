import 'dotenv/config';
import { DataSource } from 'typeorm';
import { join } from 'path';

import { entities } from './entities';

/**
 * TypeORM CLI data source for migrations.
 * `synchronize` is deliberately false: production schema changes go through migrations.
 */
const connection = process.env.DATABASE_URL
  ? { url: process.env.DATABASE_URL }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 5432),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'trustlink',
    };

export default new DataSource({
  type: 'postgres',
  ...connection,
  entities,
  migrations: [join(__dirname, '..', 'migrations', '*.{ts,js}')],
  synchronize: false,
  logging: false,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});
