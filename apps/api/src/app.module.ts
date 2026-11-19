import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { TenantMiddleware } from './common/middleware/tenant.middleware';
import { loadEnv } from './config/env';
import { AuthModule } from './modules/auth/auth.module';
import { BillingModule } from './modules/billing/billing.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { HealthController } from './modules/health/health.controller';
import { SaasPlatformModule } from './modules/integrations/saas-platform/saas-platform.module';
import { OrdersModule } from './modules/orders/orders.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (config) => loadEnv(config as NodeJS.ProcessEnv),
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 200 }]),
    PrismaModule,
    AuthModule,
    CatalogModule,
    OrdersModule,
    BillingModule,
    UploadsModule,
    SaasPlatformModule,
  ],
  controllers: [HealthController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
