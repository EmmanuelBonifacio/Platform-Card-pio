import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings(tenantId: string) {
    const t = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!t) throw new NotFoundException();
    return {
      name: t.name,
      slug: t.slug,
      subdomain: t.subdomain,
      logoUrl: t.logoUrl,
      phone: t.phone,
      email: t.email,
      whatsappNumber: t.whatsappNumber,
      metaPixelId: t.metaPixelId,
      gaMeasurementId: t.gaMeasurementId,
      gtmContainerId: t.gtmContainerId,
      settings: t.settings,
    };
  }

  async updateTracking(
    tenantId: string,
    data: {
      metaPixelId?: string | null;
      gaMeasurementId?: string | null;
      gtmContainerId?: string | null;
      subdomain?: string | null;
    },
  ) {
    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        metaPixelId: data.metaPixelId,
        gaMeasurementId: data.gaMeasurementId,
        gtmContainerId: data.gtmContainerId,
        subdomain: data.subdomain,
      },
      select: {
        metaPixelId: true,
        gaMeasurementId: true,
        gtmContainerId: true,
        subdomain: true,
      },
    });
  }

  async publicTracking(slug: string) {
    const t = await this.prisma.tenant.findUnique({
      where: { slug },
      select: {
        metaPixelId: true,
        gaMeasurementId: true,
        gtmContainerId: true,
        name: true,
      },
    });
    if (!t) throw new NotFoundException();
    return t;
  }
}
