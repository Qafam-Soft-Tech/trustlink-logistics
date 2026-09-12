import { ConfigModule, ConfigService } from '@nestjs/config';

export const redisConfig = {
  imports: [ConfigModule],
  useFactory: (configService: ConfigService) => ({
    host: configService.get('REDIS_HOST', 'localhost'),
    port: configService.get('REDIS_PORT', 6379),
    password: configService.get('REDIS_PASSWORD') || undefined,
    db: configService.get('REDIS_DB', 0),
  }),
  inject: [ConfigService],
};