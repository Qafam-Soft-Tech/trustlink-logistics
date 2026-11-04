import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { join } from 'path';
import { AppModule } from './app.module';
import { configureApp } from './app.setup';
import { FareCalculationService } from './modules/payments/services/fare-calculation.service';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { rawBody: true });

  configureApp(app);

  if ((process.env.STORAGE_DRIVER ?? 'local').toLowerCase() === 'local') {
    app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads/' });
  }

  const config = new DocumentBuilder()
    .setTitle('TrustLink Logistics API')
    .setDescription('Last-mile delivery platform API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  app.enableShutdownHooks();

  await app.get(FareCalculationService).initializeDefaults();

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 TrustLink Logistics API running on http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
}

bootstrap();
