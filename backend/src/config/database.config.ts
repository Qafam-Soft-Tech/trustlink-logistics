import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';

import { entities } from './entities';

export const databaseConfig = {
  imports: [ConfigModule],
  useFactory: (configService: ConfigService): any => {
    const nodeEnv = configService.get('NODE_ENV') ?? 'development';
    const synchronizeSetting = configService.get<string>('DB_SYNCHRONIZE');
    const synchronize = synchronizeSetting === undefined
      ? nodeEnv !== 'production'
      : synchronizeSetting === 'true';
    const sslSetting = configService.get<string>('DB_SSL');

    const databaseUrl = configService.get<string>('DATABASE_URL');
    const connection = databaseUrl
      ? { url: databaseUrl }
      : {
          host: configService.get('DB_HOST', 'localhost'),
          port: Number(configService.get('DB_PORT', 5432)),
          username: configService.get('DB_USERNAME', 'postgres'),
          password: configService.get('DB_PASSWORD', 'postgres'),
          database: configService.get('DB_NAME', 'trustlink'),
        };

    return {
      type: 'postgres',
      ...connection,
      entities,
      migrations: [join(__dirname, '..', 'migrations', '*.{ts,js}')],
      migrationsRun: configService.get<string>('DB_MIGRATIONS_RUN') === 'true',
      synchronize,
      logging: nodeEnv === 'development',
      ssl: sslSetting === 'true' || (sslSetting === undefined && nodeEnv === 'production')
        ? { rejectUnauthorized: false }
        : false,
    };
  },
  inject: [ConfigService],
};