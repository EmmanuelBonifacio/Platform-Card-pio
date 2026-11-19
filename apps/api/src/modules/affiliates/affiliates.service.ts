import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AffiliatesService {
  constructor(private readonly prisma: PrismaService) {}

  list(tenantId: string) {
    return this.prisma.affiliateLink.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(tenantId: string, code: string, commissionBps = 1000) {
    return this.prisma.affiliateLink.create({
      data: {
        tenantId,
        code: code.toUpperCase().trim(),
        commissionBps,
        status: 'ACTIVE',
      },
    });
  }

  async trackClick(tenantId: string, code: string) {
    const link = await this.prisma.affiliateLink.findUnique({
      where: { tenantId_code: { tenantId, code: code.toUpperCase() } },
    });
    if (!link) throw new NotFoundException('Link não encontrado');
    return this.prisma.affiliateLink.update({
      where: { id: link.id },
      data: { clicks: { increment: 1 } },
    });
  }
}
