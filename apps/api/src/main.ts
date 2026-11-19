import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });

  const config = app.get(ConfigService);
  const origins = (config.get<string>('ALLOWED_ORIGINS') ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  const uploadDir = config.get<string>('UPLOAD_DIR') ?? 'uploads';
  const absUpload = join(process.cwd(), uploadDir);
  if (!existsSync(absUpload)) mkdirSync(absUpload, { recursive: true });
  app.useStaticAssets(absUpload, { prefix: '/uploads/' });

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.enableCors({
    origin: origins.length ? origins : true,
    credentials: true,
  });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const swagger = new DocumentBuilder()
    .setTitle('Platform Cardápio API')
    .setDescription('FoodFlow AI — cardápio, pedidos, CRM e billing pré-pago')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swagger));

  const port = config.get<number>('PORT') ?? 3010;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`Platform Cardápio API on :${port} — docs /docs`);
}

void bootstrap();
