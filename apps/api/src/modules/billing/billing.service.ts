import { Injectable, NotFoundException } from '@nestjs/common';
import {
  CycleOrigin,
  CycleStatus,
  PaymentMethod,
  PaymentStatus,
  TenantStatus,
} from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { CreditsService } from './credits/credits.service';

/**
 * Gestor: planos, recarga, upgrade/downgrade.
 * Provider de pagamento: `manual` agora; Asaas na fase final.
 */
@Injectable()
export class BillingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly credits: CreditsService,
  ) {}

  listPlans() {
    return this.prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async getSubscription(tenantId: string) {
    const balance = await this.credits.getBalance(tenantId);
    const sub = await this.prisma.subscription.findUnique({
      where: { tenantId },
      include: { plan: true, currentCycle: true },
    });
    return { subscription: sub, balance };
  }

  /**
   * Cria cobrança de recarga/troca de plano.
   * Com provider=manual, marca como paga imediatamente (dev/homolog).
   * Em produção com Asaas: criar charge e aguardar webhook.
   */
  async checkout(
    tenantId: string,
    planCode: string,
    method: PaymentMethod,
    provider: 'manual' | 'asaas' = 'manual',
  ) {
    const plan = await this.prisma.plan.findUnique({ where: { code: planCode } });
    if (!plan) throw new NotFoundException('Plano não encontrado');

    if (provider === 'asaas') {
      // Stub — integração Asaas na fase final (compartilhada com outros sistemas)
      return {
        status: 'not_implemented',
        message:
          'Asaas será conectado na fase final. Use provider=manual em desenvolvimento.',
      };
    }

    const payment = await this.prisma.platformPayment.create({
      data: {
        tenantId,
        planId: plan.id,
        amountCents: plan.priceCents,
        method,
        status: PaymentStatus.PENDING,
        provider: 'manual',
        idempotencyKey: `checkout:${tenantId}:${plan.id}:${randomUUID()}`,
      },
    });

    return this.confirmPayment(payment.id);
  }

  async confirmPayment(paymentId: string) {
    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.platformPayment.findUnique({
        where: { id: paymentId },
        include: { plan: true },
      });
      if (!payment) throw new NotFoundException('Pagamento não encontrado');
      if (payment.status === PaymentStatus.PAID) {
        return payment;
      }

      const startsAt = new Date();
      const endsAt = new Date(startsAt);
      endsAt.setDate(endsAt.getDate() + payment.plan.cycleDays);

      await tx.creditCycle.updateMany({
        where: { tenantId: payment.tenantId, status: CycleStatus.ACTIVE },
        data: { status: CycleStatus.CLOSED },
      });

      const cycle = await tx.creditCycle.create({
        data: {
          tenantId: payment.tenantId,
          planId: payment.planId,
          startsAt,
          endsAt,
          orderLimit: payment.plan.orderLimit,
          consumed: 0,
          origin: CycleOrigin.PURCHASE,
          status: CycleStatus.ACTIVE,
          paymentId: payment.id,
        },
      });

      await tx.platformPayment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.PAID, paidAt: new Date() },
      });

      await tx.subscription.upsert({
        where: { tenantId: payment.tenantId },
        create: {
          tenantId: payment.tenantId,
          planId: payment.planId,
          status: TenantStatus.ACTIVE,
          currentCycleId: cycle.id,
        },
        update: {
          planId: payment.planId,
          status: TenantStatus.ACTIVE,
          currentCycleId: cycle.id,
        },
      });

      await tx.tenant.update({
        where: { id: payment.tenantId },
        data: {
          status: TenantStatus.ACTIVE,
          trustUntil: null,
          trustExtraOrders: 0,
        },
      });

      return { paymentId: payment.id, cycleId: cycle.id, status: 'PAID' };
    });
  }

  async trustRelease(
    tenantId: string,
    adminUserId: string | null,
    reason: string,
    hours: number,
    extraOrders: number,
  ) {
    const validUntil = new Date(Date.now() + hours * 60 * 60 * 1000);
    await this.prisma.$transaction([
      this.prisma.tenant.update({
        where: { id: tenantId },
        data: {
          status: TenantStatus.TRUST_RELEASE,
          trustUntil: validUntil,
          trustExtraOrders: extraOrders,
        },
      }),
      this.prisma.trustReleaseLog.create({
        data: {
          tenantId,
          adminUserId,
          reason,
          validUntil,
          extraOrders,
        },
      }),
    ]);
    return { tenantId, validUntil, extraOrders };
  }
}
