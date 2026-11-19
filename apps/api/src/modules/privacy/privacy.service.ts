import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * LGPD — exportação e anonimização de dados do titular.
 */
@Injectable()
export class PrivacyService {
  constructor(private readonly prisma: PrismaService) {}

  async exportCustomer(tenantId: string, customerId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, tenantId },
      include: {
        loyalty: true,
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 200,
          select: {
            id: true,
            number: true,
            status: true,
            totalCents: true,
            discountCents: true,
            type: true,
            createdAt: true,
            itemsJson: true,
          },
        },
        couponRedemptions: {
          select: { id: true, couponId: true, createdAt: true },
        },
      },
    });
    if (!customer) throw new NotFoundException('Cliente não encontrado');

    await this.prisma.auditLog.create({
      data: {
        tenantId,
        action: 'lgpd.export',
        entity: 'Customer',
        entityId: customerId,
      },
    });

    return {
      exportedAt: new Date().toISOString(),
      purpose: 'LGPD data subject access request',
      customer,
    };
  }

  async anonymizeCustomer(tenantId: string, customerId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, tenantId },
    });
    if (!customer) throw new NotFoundException('Cliente não encontrado');

    const token = customerId.slice(0, 8);
    const updated = await this.prisma.customer.update({
      where: { id: customerId },
      data: {
        name: 'Anonimizado',
        phone: `anon-${token}`,
        email: null,
        document: null,
        addresses: [],
        tags: [],
        marketingOptIn: false,
        lgpdConsentAt: null,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        tenantId,
        action: 'lgpd.anonymize',
        entity: 'Customer',
        entityId: customerId,
      },
    });

    return {
      ok: true,
      id: updated.id,
      phone: updated.phone,
    };
  }

  async consent(tenantId: string, customerId: string, optIn: boolean) {
    await this.prisma.customer.updateMany({
      where: { id: customerId, tenantId },
      data: {
        marketingOptIn: optIn,
        lgpdConsentAt: optIn ? new Date() : null,
      },
    });
    return { ok: true };
  }
}
