import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, OrderType, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreditsService } from '../billing/credits/credits.service';

type CreatePublicOrderInput = {
  type: OrderType;
  items: Array<{
    productId?: string;
    name: string;
    quantity: number;
    unitPriceCents: number;
    addons?: Array<{ name: string; priceCents: number }>;
  }>;
  notes?: string;
  addressJson?: Prisma.InputJsonValue;
  customerPhone: string;
  customerName?: string;
  source?: string;
};

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly credits: CreditsService,
  ) {}

  /**
   * Cliente cria pedido → status PENDING.
   * NÃO debita crédito aqui.
   */
  async resolveTenantIdBySlug(slug: string): Promise<string> {
    const tenant = await this.prisma.tenant.findUnique({ where: { slug } });
    if (!tenant) throw new NotFoundException('Estabelecimento não encontrado');
    return tenant.id;
  }

  async createPublic(tenantId: string, input: CreatePublicOrderInput) {
    const customer = await this.prisma.customer.upsert({
      where: {
        tenantId_phone: { tenantId, phone: input.customerPhone },
      },
      create: {
        tenantId,
        phone: input.customerPhone,
        name: input.customerName,
      },
      update: {
        name: input.customerName ?? undefined,
      },
    });

    const subtotal = input.items.reduce((acc, item) => {
      const addons = (item.addons ?? []).reduce((a, x) => a + x.priceCents, 0);
      return acc + (item.unitPriceCents + addons) * item.quantity;
    }, 0);

    const last = await this.prisma.order.findFirst({
      where: { tenantId },
      orderBy: { number: 'desc' },
      select: { number: true },
    });

    return this.prisma.order.create({
      data: {
        tenantId,
        customerId: customer.id,
        number: (last?.number ?? 0) + 1,
        type: input.type,
        status: OrderStatus.PENDING,
        itemsJson: input.items,
        subtotalCents: subtotal,
        totalCents: subtotal,
        notes: input.notes,
        addressJson: input.addressJson,
        source: input.source ?? 'web',
        creditDebited: false,
      },
    });
  }

  /**
   * Lojista ACEITA o pedido → debita 1 crédito (regra oficial).
   */
  async accept(tenantId: string, orderId: string, userId: string) {
    const gate = await this.credits.assertCanAcceptOrder(tenantId);

    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: { id: orderId, tenantId },
      });
      if (!order) throw new NotFoundException('Pedido não encontrado');
      if (order.status !== OrderStatus.PENDING) {
        throw new BadRequestException({
          code: 'ORDER_NOT_PENDING',
          message: `Pedido já está em status ${order.status}`,
        });
      }
      if (order.creditDebited) {
        throw new BadRequestException({
          code: 'ORDER_ALREADY_DEBITED',
          message: 'Crédito já foi debitado para este pedido',
        });
      }

      let cycleId = gate.cycleId;
      if (gate.mode === 'cycle') {
        if (!cycleId) {
          throw new BadRequestException('Ciclo inválido');
        }
        const ok = await this.credits.debitOne(tx, cycleId);
        if (!ok) {
          throw new BadRequestException({
            code: 'CARDAPIO_CREDITS_EXHAUSTED',
            message: 'Sem créditos no momento do aceite',
          });
        }
      }

      const updated = await tx.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.ACCEPTED,
          acceptedAt: new Date(),
          acceptedById: userId,
          creditDebited: gate.mode === 'cycle',
          creditCycleId: cycleId,
        },
      });

      await tx.auditLog.create({
        data: {
          tenantId,
          userId,
          action: 'order.accept',
          entity: 'Order',
          entityId: order.id,
          metadata: { creditDebited: updated.creditDebited, cycleId },
        },
      });

      return updated;
    });
  }

  async reject(tenantId: string, orderId: string, reason?: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, tenantId },
    });
    if (!order) throw new NotFoundException('Pedido não encontrado');
    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Só pedidos pendentes podem ser rejeitados');
    }
    // Rejeição NÃO debita crédito
    return this.prisma.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.REJECTED,
        cancelledAt: new Date(),
        cancelReason: reason,
      },
    });
  }

  async list(tenantId: string, status?: OrderStatus) {
    return this.prisma.order.findMany({
      where: { tenantId, ...(status ? { status } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { customer: { select: { id: true, name: true, phone: true } } },
    });
  }

  async updateStatus(
    tenantId: string,
    orderId: string,
    status: OrderStatus,
  ) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, tenantId },
    });
    if (!order) throw new NotFoundException('Pedido não encontrado');
    return this.prisma.order.update({
      where: { id: order.id },
      data: {
        status,
        deliveredAt:
          status === OrderStatus.DELIVERED ? new Date() : order.deliveredAt,
      },
    });
  }
}
