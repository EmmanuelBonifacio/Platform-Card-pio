import { Injectable } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Insights de IA — heurísticas locais agora; plugar LLM depois.
 */
@Injectable()
export class AiService {
  constructor(private readonly prisma: PrismaService) {}

  async insights(tenantId: string) {
    const since = new Date();
    since.setDate(since.getDate() - 14);

    const [orders, products, customers] = await Promise.all([
      this.prisma.order.findMany({
        where: { tenantId, createdAt: { gte: since } },
        select: {
          status: true,
          totalCents: true,
          itemsJson: true,
          createdAt: true,
          type: true,
        },
      }),
      this.prisma.product.findMany({
        where: { tenantId, isActive: true },
        select: { id: true, name: true, isFeatured: true, isAvailable: true },
      }),
      this.prisma.customer.count({ where: { tenantId } }),
    ]);

    const itemCount = new Map<string, number>();
    let rejected = 0;
    let delivery = 0;
    for (const o of orders) {
      if (o.status === OrderStatus.REJECTED) rejected += 1;
      if (o.type === 'DELIVERY') delivery += 1;
      const items = o.itemsJson as Array<{ name?: string; quantity?: number }>;
      if (Array.isArray(items)) {
        for (const it of items) {
          if (!it.name) continue;
          itemCount.set(
            it.name,
            (itemCount.get(it.name) ?? 0) + (it.quantity ?? 1),
          );
        }
      }
    }

    const topItems = [...itemCount.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, qty]) => ({ name, qty }));

    const tips: string[] = [];
    if (topItems[0]) {
      tips.push(
        `Upsell: ofereça bebida junto com “${topItems[0].name}” (mais pedido).`,
      );
    }
    if (rejected > 3) {
      tips.push(
        `${rejected} rejeições em 14 dias — revise estoque/horário de pico.`,
      );
    }
    if (delivery / Math.max(orders.length, 1) > 0.6) {
      tips.push(
        'Maioria delivery — destaque taxa grátis acima de um valor mínimo.',
      );
    }
    const paused = products.filter((p) => !p.isAvailable).length;
    if (paused > 0) {
      tips.push(`${paused} produto(s) pausado(s) — reative itens populares.`);
    }
    if (!products.some((p) => p.isFeatured)) {
      tips.push('Marque 2–3 itens como destaque para aumentar conversão.');
    }
    if (customers < 10) {
      tips.push('CRM ainda pequeno — ative cupom de primeira compra.');
    }

    return {
      engine: 'heuristics-v1',
      windowDays: 14,
      topItems,
      tips,
      crossSell: topItems.slice(0, 2).map((t) => ({
        anchor: t.name,
        suggest: 'Combo + bebida',
      })),
    };
  }
}
