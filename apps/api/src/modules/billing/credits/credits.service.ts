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
    const cycle = await tx.creditCycle.findUnique({ where: { id: cycleId } });
    if (!cycle || cycle.status !== CycleStatus.ACTIVE) return false;
    if (cycle.orderLimit != null && cycle.consumed >= cycle.orderLimit) {
      return false;
    }
    // Optimistic lock em `consumed` evita débito duplo sob concorrência.
    const updated = await tx.creditCycle.updateMany({
      where: {
        id: cycleId,
        status: CycleStatus.ACTIVE,
        consumed: cycle.consumed,
        ...(cycle.orderLimit == null
          ? {}
          : { orderLimit: cycle.orderLimit }),
      },
      data: { consumed: { increment: 1 } },
    });
    return updated.count === 1;
  }

  async getBalance(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        status: true,
        trustUntil: true,
        trustExtraOrders: true,
      },
    });
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
        tenantStatus: tenant?.status ?? null,
        alerts: [
          {
            level: 'critical' as const,
            code: 'NO_CYCLE',
            message: 'Nenhum ciclo ativo. Faça uma recarga no Gestor.',
          },
        ],
      };
    }
    const { currentCycle: c, plan } = sub;
    const remaining =
      c.orderLimit == null ? null : Math.max(0, c.orderLimit - c.consumed);
    const now = new Date();
    const msLeft = c.endsAt.getTime() - now.getTime();
    const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));
    const alerts: Array<{
      level: 'info' | 'warning' | 'critical';
      code: string;
      message: string;
    }> = [];

    if (c.status !== 'ACTIVE' || c.endsAt < now) {
      alerts.push({
        level: 'critical',
        code: 'CYCLE_EXPIRED',
        message: 'Ciclo expirado. Recarregue para continuar aceitando pedidos.',
      });
    } else if (daysLeft <= 3) {
      alerts.push({
        level: 'warning',
        code: 'CYCLE_ENDING',
        message: `Ciclo termina em ${daysLeft} dia(s).`,
      });
    }

    if (c.orderLimit != null) {
      const pct = c.consumed / c.orderLimit;
      if (remaining === 0) {
        alerts.push({
          level: 'critical',
          code: 'CREDITS_EXHAUSTED',
          message: 'Créditos esgotados. Recarregue ou peça liberação em confiança.',
        });
      } else if (pct >= 0.9) {
        alerts.push({
          level: 'warning',
          code: 'CREDITS_LOW',
          message: `Saldo baixo: restam ${remaining} de ${c.orderLimit} pedidos.`,
        });
      }
    }

    if (
      tenant?.status === 'TRUST_RELEASE' &&
      tenant.trustUntil &&
      tenant.trustUntil > now
    ) {
      alerts.push({
        level: 'info',
        code: 'TRUST_ACTIVE',
        message: `Liberação em confiança até ${tenant.trustUntil.toISOString()} (+${tenant.trustExtraOrders} pedidos).`,
      });
    }

    return {
      plan,
      limit: c.orderLimit,
      consumed: c.consumed,
      remaining,
      endsAt: c.endsAt,
      daysLeft,
      status: c.status,
      tenantStatus: tenant?.status ?? null,
      alerts,
    };
  }
}
