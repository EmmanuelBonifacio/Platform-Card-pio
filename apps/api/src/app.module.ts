import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TenantMiddleware } from './common/middleware/tenant.middleware';
import { loadEnv } from './config/env';
import { RedisModule } from './core/redis/redis.module';
import { AffiliatesModule } from './modules/affiliates/affiliates.module';
import { AiModule } from './modules/ai/ai.module';
import { AuthModule } from './modules/auth/auth.module';
import { BillingModule } from './modules/billing/billing.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { CrmModule } from './modules/crm/crm.module';
import { HealthController } from './modules/health/health.controller';
import { SaasPlatformModule } from './modules/integrations/saas-platform/saas-platform.module';
import { MarketingModule } from './modules/marketing/marketing.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PrivacyModule } from './modules/privacy/privacy.module';
import { PushModule } from './modules/push/push.module';
import { ReportsModule } from './modules/reports/reports.module';
import { StoresModule } from './modules/stores/stores.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { WhatsappModule } from './modules/whatsapp/whatsapp.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (config) => loadEnv(config as NodeJS.ProcessEnv),
    }),
    ThrottlerModule.forRoot([
      { name: 'default', ttl: 60_000, limit: 200 },
    ]),
    RedisModule,
    PrismaModule,
    AuthModule,
    CatalogModule,
    OrdersModule,
    BillingModule,
    UploadsModule,
    SaasPlatformModule,
    MarketingModule,
    ReportsModule,
    CrmModule,
    WhatsappModule,
    AiModule,
    AffiliatesModule,
    TenantsModule,
    PushModule,
    StoresModule,
    PrivacyModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
