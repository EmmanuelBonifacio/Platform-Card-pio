import { Injectable, NotFoundException } from '@nestjs/common';
import { RedisService } from '../../core/redis/redis.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CatalogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async publicMenu(slug: string) {
    const cacheKey = `menu:public:${slug}`;
    const cached = await this.redis.getJson<unknown>(cacheKey).catch(() => null);
    if (cached) return cached;

    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        subdomain: true,
        whatsappNumber: true,
        metaPixelId: true,
        gaMeasurementId: true,
        gtmContainerId: true,
      },
    });
    if (!tenant) throw new NotFoundException('Estabelecimento não encontrado');

    const categories = await this.prisma.category.findMany({
      where: { tenantId: tenant.id, isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        products: {
          where: { isActive: true, isAvailable: true },
          orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }],
          include: {
            productAddons: { include: { addon: true } },
          },
        },
      },
    });

    const combos = await this.prisma.combo.findMany({
      where: { tenantId: tenant.id, isActive: true },
      include: { items: { include: { product: true } } },
    });

    const menu = { tenant, categories, combos };
    await this.redis.setJson(cacheKey, menu, 30).catch(() => undefined);
    return menu;
  }

  async invalidateMenuCache(slug: string) {
    await this.redis.del(`menu:public:${slug}`).catch(() => undefined);
  }

  async search(tenantId: string, q: string) {
    const term = q.trim();
    if (!term) return [];
    return this.prisma.product.findMany({
      where: {
        tenantId,
        isActive: true,
        OR: [
          { name: { contains: term, mode: 'insensitive' } },
          { description: { contains: term, mode: 'insensitive' } },
        ],
      },
      take: 30,
      orderBy: { isFeatured: 'desc' },
    });
  }
}
