import { Injectable } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async dashboard(tenantId: string) {
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const orders = await this.prisma.order.findMany({
      where: { tenantId, createdAt: { gte: since } },
      select: {
        id: true,
        status: true,
        totalCents: true,
        creditDebited: true,
        createdAt: true,
        type: true,
      },
    });

    const byStatus: Record<string, number> = {};
    let revenueCents = 0;
    let accepted = 0;
    const daily = new Map<string, { orders: number; revenueCents: number }>();

    for (const o of orders) {
      byStatus[o.status] = (byStatus[o.status] ?? 0) + 1;
      if (
        o.status !== OrderStatus.CANCELLED &&
        o.status !== OrderStatus.REJECTED &&
        o.status !== OrderStatus.PENDING
      ) {
        revenueCents += o.totalCents;
      }
      if (o.creditDebited) accepted += 1;
      const day = o.createdAt.toISOString().slice(0, 10);
      const bucket = daily.get(day) ?? { orders: 0, revenueCents: 0 };
      bucket.orders += 1;
      if (o.creditDebited) bucket.revenueCents += o.totalCents;
      daily.set(day, bucket);
    }

    const topCustomers = await this.prisma.customer.findMany({
      where: { tenantId },
      orderBy: { totalSpentCents: 'desc' },
      take: 5,
      select: {
        id: true,
        name: true,
        phone: true,
        totalOrders: true,
        totalSpentCents: true,
        loyaltyScore: true,
      },
    });

    return {
      periodDays: 30,
      totals: {
        orders: orders.length,
        accepted,
        revenueCents,
        ticketMedioCents:
          accepted > 0 ? Math.round(revenueCents / accepted) : 0,
      },
      byStatus,
      series: [...daily.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, v]) => ({ date, ...v })),
      topCustomers,
    };
  }

  async exportCsv(tenantId: string) {
    const orders = await this.prisma.order.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 2000,
      include: { customer: { select: { name: true, phone: true } } },
    });
    const header = [
      'number',
      'status',
      'type',
      'total_cents',
      'credit_debited',
      'customer_name',
      'customer_phone',
      'created_at',
    ];
    const lines = [header.join(',')];
    for (const o of orders) {
      lines.push(
        [
          o.number,
          o.status,
          o.type,
          o.totalCents,
          o.creditDebited,
          JSON.stringify(o.customer?.name ?? ''),
          o.customer?.phone ?? '',
          o.createdAt.toISOString(),
        ].join(','),
      );
    }
    return lines.join('\n');
  }
}
