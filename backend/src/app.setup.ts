import { ClassSerializerInterceptor, INestApplication, ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import helmet from 'helmet';
import cors from 'cors';

import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

/**
 * Shared HTTP configuration for `main.ts` and the e2e harness, so tests exercise
 * exactly the same prefix, validation, serialization and error shape as production.
 */
export function configureApp(app: INestApplication): void {
  app.setGlobalPrefix('api');

  // Render/Railway/NGINX terminate TLS and forward the client IP/protocol.
  const expressApp = app as INestApplication & { set?: (key: string, value: unknown) => void };
  expressApp.set?.('trust proxy', 1);

  app.use(helmet());

  const allowedOrigins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.use(cors({
    origin: (origin, callback) => {
      // Mobile apps and server-to-server calls have no Origin header.
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      // Local development remains permissive; production must configure CORS_ORIGINS.
      if (allowedOrigins.length === 0 && process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
  }));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
}
