import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CycleStatus, Prisma, TenantStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

/**
 * Débito de crédito de pedido.
 * REGRA DE NEGÓCIO (aprovada): só debita quando o lojista ACEITA o pedido.
 */
@Injectable()
export class CreditsService {
  constructor(private readonly prisma: PrismaService) {}

  async assertCanAcceptOrder(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        subscription: { include: { currentCycle: true, plan: true } },
      },
    });
    if (!tenant) throw new NotFoundException('Tenant not found');

    if (
      tenant.status === TenantStatus.BLOCKED ||
      tenant.status === TenantStatus.SUSPENDED
    ) {
      throw new ForbiddenException({
        code: 'CARDAPIO_TENANT_BLOCKED',
        message: 'Estabelecimento bloqueado. Recarregue o plano no Gestor.',
      });
    }

    const now = new Date();
    if (
      tenant.status === TenantStatus.TRUST_RELEASE &&
      tenant.trustUntil &&
      tenant.trustUntil > now
    ) {
      return { mode: 'trust' as const, cycleId: tenant.subscription?.currentCycleId ?? null };
    }

    const cycle = tenant.subscription?.currentCycle;
    if (!cycle || cycle.status !== CycleStatus.ACTIVE) {
      throw new ForbiddenException({
        code: 'CARDAPIO_CYCLE_EXPIRED',
        message: 'Ciclo expirado ou inexistente. Faça uma recarga.',
      });
    }
    if (cycle.endsAt < now) {
      await this.prisma.creditCycle.update({
        where: { id: cycle.id },
        data: { status: CycleStatus.EXPIRED },
      });
      await this.prisma.tenant.update({
        where: { id: tenantId },
        data: { status: TenantStatus.EXHAUSTED },
      });
      throw new ForbiddenException({
        code: 'CARDAPIO_CYCLE_EXPIRED',
        message: 'Ciclo de 30 dias encerrado. Faça uma recarga.',
      });
    }
    if (cycle.orderLimit != null && cycle.consumed >= cycle.orderLimit) {
      await this.prisma.tenant.update({
        where: { id: tenantId },
        data: { status: TenantStatus.EXHAUSTED },
      });
      throw new ForbiddenException({
        code: 'CARDAPIO_CREDITS_EXHAUSTED',
        message: 'Créditos esgotados. Recarregue para continuar aceitando pedidos.',
      });
    }

    return { mode: 'cycle' as const, cycleId: cycle.id };
  }

  /**
   * Incrementa consumidos de forma atômica.
   * Retorna false se não houver saldo (race condition).
   */
  async debitOne(
    tx: Prisma.TransactionClient,
    cycleId: string,
  ): Promise<boolean> {
    const updated = await tx.$executeRaw`
      UPDATE credit_cycles
      SET consumed = consumed + 1, updated_at = NOW()
      WHERE id = ${cycleId}::uuid
        AND status = 'ACTIVE'
        AND (order_limit IS NULL OR consumed < order_limit)
    `;
    return updated === 1;
  }

  async getBalance(tenantId: string) {
    const sub = await this.prisma.subscription.findUnique({
      where: { tenantId },
      include: { plan: true, currentCycle: true },
    });
    if (!sub?.currentCycle) {
      return {
        plan: sub?.plan ?? null,
        limit: null,
        consumed: 0,
        remaining: 0,
        endsAt: null,
        status: 'none',
      };
    }
    const { currentCycle: c, plan } = sub;
    const remaining =
      c.orderLimit == null ? null : Math.max(0, c.orderLimit - c.consumed);
    return {
      plan,
      limit: c.orderLimit,
      consumed: c.consumed,
      remaining,
      endsAt: c.endsAt,
      status: c.status,
    };
  }
}
