import { DataSourceOptions } from 'typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

export const testDatabaseConfig = {
  imports: [ConfigModule],
  useFactory: (configService: ConfigService): DataSourceOptions => ({
    type: 'sqlite',
    database: ':memory:',
    entities: [__dirname + '/../src/**/*.entity{.ts,.js}'],
    synchronize: true,
    logging: configService.get('NODE_ENV') === 'development',
  }),
  inject: [ConfigService],
};