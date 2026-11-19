import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);

  constructor(private readonly prisma: PrismaService) {}

  list(tenantId: string) {
    return this.prisma.pushSubscription.findMany({
      where: { tenantId },
      select: {
        id: true,
        endpoint: true,
        userAgent: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async subscribe(
    tenantId: string,
    data: {
      endpoint: string;
      keys: { p256dh: string; auth: string };
      userAgent?: string;
    },
  ) {
    return this.prisma.pushSubscription.upsert({
      where: {
        tenantId_endpoint: { tenantId, endpoint: data.endpoint },
      },
      create: {
        tenantId,
        endpoint: data.endpoint,
        p256dh: data.keys.p256dh,
        auth: data.keys.auth,
        userAgent: data.userAgent,
      },
      update: {
        p256dh: data.keys.p256dh,
        auth: data.keys.auth,
        userAgent: data.userAgent,
      },
    });
  }

  async unsubscribe(tenantId: string, endpoint: string) {
    await this.prisma.pushSubscription.deleteMany({
      where: { tenantId, endpoint },
    });
    return { ok: true };
  }

  /**
   * Enfileira notificação stub (VAPID/web-push real depois).
   */
  async notifyTenant(
    tenantId: string,
    payload: { title: string; body: string; url?: string },
  ) {
    const subs = await this.prisma.pushSubscription.findMany({
      where: { tenantId },
      take: 100,
    });
    if (!subs.length) return { queued: 0 };

    await this.prisma.integrationEvent.create({
      data: {
        source: 'push',
        eventKey: `push.out.${tenantId}.${Date.now()}`,
        payload: {
          ...payload,
          endpoints: subs.map((s) => s.endpoint),
          status: 'queued_stub',
        },
        status: 'processed',
        processedAt: new Date(),
      },
    });
    this.logger.log(
      `Push stub queued for ${subs.length} device(s): ${payload.title}`,
    );
    return { queued: subs.length };
  }
}
