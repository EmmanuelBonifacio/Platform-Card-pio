import { Injectable, NotFoundException } from '@nestjs/common';
import { LoyaltyTier, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CrmService {
  constructor(private readonly prisma: PrismaService) {}

  listCustomers(
    tenantId: string,
    opts: { q?: string; segment?: string; take?: number } = {},
  ) {
    const where: Prisma.CustomerWhereInput = {
      tenantId,
      ...(opts.segment ? { segment: opts.segment } : {}),
      ...(opts.q
        ? {
            OR: [
              { name: { contains: opts.q, mode: 'insensitive' } },
              { phone: { contains: opts.q } },
              { email: { contains: opts.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    return this.prisma.customer.findMany({
      where,
      orderBy: [{ loyaltyScore: 'desc' }, { totalSpentCents: 'desc' }],
      take: Math.min(opts.take ?? 50, 100),
      include: {
        loyalty: true,
        _count: { select: { orders: true } },
      },
    });
  }

  async getCustomer(tenantId: string, id: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, tenantId },
      include: {
        loyalty: true,
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: {
            id: true,
            number: true,
            status: true,
            totalCents: true,
            createdAt: true,
          },
        },
      },
    });
    if (!customer) throw new NotFoundException('Cliente não encontrado');
    return customer;
  }

  async updateCustomer(
    tenantId: string,
    id: string,
    data: Partial<{
      name: string;
      email: string;
      tags: string[];
      segment: string;
      marketingOptIn: boolean;
    }>,
  ) {
    await this.getCustomer(tenantId, id);
    return this.prisma.customer.update({ where: { id }, data });
  }

  async segments(tenantId: string) {
    const customers = await this.prisma.customer.findMany({
      where: { tenantId },
      select: {
        id: true,
        totalOrders: true,
        totalSpentCents: true,
        lastOrderAt: true,
        loyaltyScore: true,
      },
    });
    const now = Date.now();
    let vip = 0;
    let ativos = 0;
    let risco = 0;
    let novos = 0;
    for (const c of customers) {
      if (c.loyaltyScore >= 80 || c.totalSpentCents >= 50000) vip += 1;
      else if (c.totalOrders <= 1) novos += 1;
      const days =
        c.lastOrderAt != null
          ? (now - c.lastOrderAt.getTime()) / (1000 * 60 * 60 * 24)
          : 999;
      if (days <= 30) ativos += 1;
      else if (days > 60 && c.totalOrders > 0) risco += 1;
    }
    return {
      total: customers.length,
      vip,
      ativos,
      risco,
      novos,
    };
  }

  /**
   * Atualiza score/gastos após aceite de pedido.
   */
  async onOrderAccepted(
    tenantId: string,
    customerId: string | null | undefined,
    totalCents: number,
  ) {
    if (!customerId) return;
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, tenantId },
      include: { loyalty: true },
    });
    if (!customer) return;

    const pointsGain = Math.max(1, Math.floor(totalCents / 100));
    const cashback = Math.floor(totalCents * 0.02);
    const newScore = Math.min(
      100,
      customer.loyaltyScore + Math.min(10, pointsGain),
    );
    const tier: LoyaltyTier =
      newScore >= 80
        ? LoyaltyTier.VIP
        : newScore >= 60
          ? LoyaltyTier.GOLD
          : newScore >= 35
            ? LoyaltyTier.SILVER
            : LoyaltyTier.BRONZE;

    await this.prisma.customer.update({
      where: { id: customerId },
      data: {
        totalOrders: { increment: 1 },
        totalSpentCents: { increment: totalCents },
        lastOrderAt: new Date(),
        loyaltyScore: newScore,
        segment:
          tier === LoyaltyTier.VIP
            ? 'vip'
            : customer.totalOrders <= 1
              ? 'novo'
              : 'ativo',
      },
    });

    if (customer.loyalty) {
      await this.prisma.loyaltyAccount.update({
        where: { customerId },
        data: {
          points: { increment: pointsGain },
          cashbackCents: { increment: cashback },
          stamps: { increment: 1 },
          tier,
        },
      });
    } else {
      await this.prisma.loyaltyAccount.create({
        data: {
          tenantId,
          customerId,
          points: pointsGain,
          cashbackCents: cashback,
          stamps: 1,
          tier,
        },
      });
    }
  }
}
