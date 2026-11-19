import {
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';
import { TenantStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuthService } from '../../auth/auth.service';

export type SaasProvisionPayload = {
  saasTenantId: string;
  saasSlug: string;
  name: string;
  ownerEmail: string;
  ownerName: string;
  saasUserId: string;
  planCode?: string;
};

/**
 * Ponte com EmmanuelBonifacio/SaaSPlatformDev.
 * - Webhook de provisionamento quando o módulo cardápio é ativado no SaaS
 * - SSO JWT assinado com SAAS_PLATFORM_SHARED_SECRET
 */
@Injectable()
export class SaasPlatformService {
  private readonly logger = new Logger(SaasPlatformService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly auth: AuthService,
  ) {}

  verifyWebhookSignature(rawBody: Buffer, signatureHeader?: string) {
    const secret = this.config.get<string>('SAAS_PLATFORM_WEBHOOK_SECRET');
    if (!secret) {
      throw new UnauthorizedException('Webhook secret not configured');
    }
    if (!signatureHeader) {
      throw new UnauthorizedException('Missing signature');
    }
    const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
    const a = Buffer.from(expected);
    const b = Buffer.from(signatureHeader.replace(/^sha256=/, ''));
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new UnauthorizedException('Invalid signature');
    }
  }

  async provisionTenant(payload: SaasProvisionPayload) {
    const eventKey = `saas.provision.${payload.saasTenantId}`;
    const existing = await this.prisma.integrationEvent.findUnique({
      where: { eventKey },
    });
    if (existing?.status === 'processed') {
      return this.prisma.tenant.findUnique({
        where: { saasTenantId: payload.saasTenantId },
      });
    }

    // Claim atômico: só um worker processa (idempotência sob retry/concorrência)
    await this.prisma.integrationEvent.upsert({
      where: { eventKey },
      create: {
        source: 'saas_platform',
        eventKey,
        payload,
        status: 'processing',
      },
      update: {},
    });
    const claimed = await this.prisma.integrationEvent.updateMany({
      where: {
        eventKey,
        status: { in: ['received', 'processing', 'failed'] },
      },
      data: { status: 'processing', payload, error: null },
    });
    const again = await this.prisma.integrationEvent.findUnique({
      where: { eventKey },
    });
    if (again?.status === 'processed') {
      return this.prisma.tenant.findUnique({
        where: { saasTenantId: payload.saasTenantId },
      });
    }
    if (claimed.count === 0 && again?.status === 'processing') {
      // outro worker já reivindicou — devolve estado atual se existir
      const tenant = await this.prisma.tenant.findUnique({
        where: { saasTenantId: payload.saasTenantId },
      });
      if (tenant) return tenant;
    }

    const planCode = payload.planCode ?? 'iniciante';
    const plan = await this.prisma.plan.findUnique({ where: { code: planCode } });
    if (!plan) {
      throw new Error(`Plan ${planCode} not seeded`);
    }

    const tenant = await this.prisma.$transaction(async (tx) => {
      const t = await tx.tenant.upsert({
        where: { saasTenantId: payload.saasTenantId },
        create: {
          name: payload.name,
          slug: payload.saasSlug,
          subdomain: payload.saasSlug,
          saasTenantId: payload.saasTenantId,
          saasSlug: payload.saasSlug,
          email: payload.ownerEmail,
          status: TenantStatus.TRIAL,
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        },
        update: {
          name: payload.name,
          saasSlug: payload.saasSlug,
        },
      });

      await tx.user.upsert({
        where: { email: payload.ownerEmail },
        create: {
          tenantId: t.id,
          email: payload.ownerEmail,
          name: payload.ownerName,
          saasUserId: payload.saasUserId,
          role: 'TENANT_OWNER',
        },
        update: {
          tenantId: t.id,
          saasUserId: payload.saasUserId,
          name: payload.ownerName,
        },
      });

      const startsAt = new Date();
      const endsAt = new Date(startsAt);
      endsAt.setDate(endsAt.getDate() + plan.cycleDays);

      const cycle = await tx.creditCycle.create({
        data: {
          tenantId: t.id,
          planId: plan.id,
          startsAt,
          endsAt,
          orderLimit: plan.orderLimit,
          consumed: 0,
          origin: 'TRIAL',
          status: 'ACTIVE',
        },
      });

      await tx.subscription.upsert({
        where: { tenantId: t.id },
        create: {
          tenantId: t.id,
          planId: plan.id,
          status: TenantStatus.TRIAL,
          currentCycleId: cycle.id,
        },
        update: {
          planId: plan.id,
          currentCycleId: cycle.id,
          status: TenantStatus.TRIAL,
        },
      });

      await tx.integrationEvent.update({
        where: { eventKey },
        data: { status: 'processed', processedAt: new Date() },
      });

      return t;
    });

    this.logger.log(`Provisioned tenant ${tenant.slug} from SaaS Platform`);
    return tenant;
  }

  async ssoExchange(body: {
    saasUserId: string;
    saasTenantId: string;
    email: string;
    name: string;
    signature: string;
    timestamp: number;
  }) {
    const secret = this.config.get<string>('SAAS_PLATFORM_SHARED_SECRET');
    if (!secret) {
      throw new UnauthorizedException('SSO not configured');
    }
    const ageMs = Math.abs(Date.now() - body.timestamp);
    if (ageMs > 5 * 60 * 1000) {
      throw new UnauthorizedException('SSO timestamp expired');
    }
    const base = `${body.saasUserId}:${body.saasTenantId}:${body.email}:${body.timestamp}`;
    const expected = createHmac('sha256', secret).update(base).digest('hex');
    const a = Buffer.from(expected);
    const b = Buffer.from(body.signature);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new UnauthorizedException('Invalid SSO signature');
    }
    return this.auth.loginFromSaasPlatform(body);
  }
}
