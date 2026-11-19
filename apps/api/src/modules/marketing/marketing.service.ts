import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CampaignType, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MarketingService {
  constructor(private readonly prisma: PrismaService) {}

  listCoupons(tenantId: string) {
    return this.prisma.coupon.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  createCoupon(
    tenantId: string,
    data: {
      code: string;
      description?: string;
      discountType: 'percent' | 'fixed';
      discountValue: number;
      minOrderCents?: number;
      maxRedemptions?: number;
      startsAt?: string;
      endsAt?: string;
    },
  ) {
    return this.prisma.coupon.create({
      data: {
        tenantId,
        code: data.code.toUpperCase().trim(),
        description: data.description,
        discountType: data.discountType,
        discountValue: data.discountValue,
        minOrderCents: data.minOrderCents,
        maxRedemptions: data.maxRedemptions,
        startsAt: data.startsAt ? new Date(data.startsAt) : undefined,
        endsAt: data.endsAt ? new Date(data.endsAt) : undefined,
      },
    });
  }

  async toggleCoupon(tenantId: string, id: string, isActive: boolean) {
    const row = await this.prisma.coupon.findFirst({ where: { id, tenantId } });
    if (!row) throw new NotFoundException('Cupom não encontrado');
    return this.prisma.coupon.update({ where: { id }, data: { isActive } });
  }

  async validateCouponBySlug(slug: string, code: string, orderCents: number) {
    const tenant = await this.prisma.tenant.findUnique({ where: { slug } });
    if (!tenant) return { valid: false as const, message: 'Loja não encontrada' };
    try {
      const result = await this.validateCoupon(tenant.id, code, orderCents);
      return { valid: true as const, ...result };
    } catch (e) {
      return {
        valid: false as const,
        message: e instanceof Error ? e.message : 'Cupom inválido',
      };
    }
  }

  async validateCoupon(tenantId: string, code: string, orderCents: number) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { tenantId_code: { tenantId, code: code.toUpperCase().trim() } },
    });
    if (!coupon || !coupon.isActive) {
      throw new BadRequestException('Cupom inválido');
    }
    const now = new Date();
    if (coupon.startsAt && coupon.startsAt > now) {
      throw new BadRequestException('Cupom ainda não válido');
    }
    if (coupon.endsAt && coupon.endsAt < now) {
      throw new BadRequestException('Cupom expirado');
    }
    if (
      coupon.maxRedemptions != null &&
      coupon.redeemedCount >= coupon.maxRedemptions
    ) {
      throw new BadRequestException('Cupom esgotado');
    }
    if (coupon.minOrderCents != null && orderCents < coupon.minOrderCents) {
      throw new BadRequestException('Pedido abaixo do mínimo do cupom');
    }
    const discountCents =
      coupon.discountType === 'percent'
        ? Math.floor((orderCents * coupon.discountValue) / 100)
        : coupon.discountValue;
    return {
      couponId: coupon.id,
      code: coupon.code,
      discountCents: Math.min(discountCents, orderCents),
    };
  }

  listCampaigns(tenantId: string) {
    return this.prisma.campaign.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  createCampaign(
    tenantId: string,
    data: {
      name: string;
      type: CampaignType;
      payload?: Prisma.InputJsonValue;
      startsAt?: string;
      endsAt?: string;
    },
  ) {
    return this.prisma.campaign.create({
      data: {
        tenantId,
        name: data.name,
        type: data.type,
        payload: data.payload ?? {},
        startsAt: data.startsAt ? new Date(data.startsAt) : undefined,
        endsAt: data.endsAt ? new Date(data.endsAt) : undefined,
      },
    });
  }

  async toggleCampaign(tenantId: string, id: string, isActive: boolean) {
    const row = await this.prisma.campaign.findFirst({
      where: { id, tenantId },
    });
    if (!row) throw new NotFoundException('Campanha não encontrada');
    return this.prisma.campaign.update({ where: { id }, data: { isActive } });
  }
}
