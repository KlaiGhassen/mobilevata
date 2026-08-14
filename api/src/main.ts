import { config as loadEnv } from 'dotenv';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { assertJwtSecretConfigured } from './common/security/jwt-secret';
import { resolveCorsOrigins } from './common/security/cors-origins';

async function bootstrap() {
  // Prefer api/.env locally; never override orchestrator secrets in production.
  loadEnv({ override: process.env.NODE_ENV !== 'production' });
  assertJwtSecretConfigured(process.env.JWT_SECRET);

  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cookieParser());
  app.enableCors({
    origin: resolveCorsOrigins(),
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter());
  const port = Number(process.env.PORT ?? 4000);
  const host = process.env.HOST || '127.0.0.1';
  await app.listen(port, host);
  console.log(`API running on http://${host}:${port}`);
}
bootstrap();
