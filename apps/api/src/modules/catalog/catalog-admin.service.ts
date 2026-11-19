import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

function slugify(input: string) {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80);
}

@Injectable()
export class CatalogAdminService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Categories ──────────────────────────────────────────────────────────
  listCategories(tenantId: string) {
    return this.prisma.category.findMany({
      where: { tenantId },
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { products: true } } },
    });
  }

  async createCategory(
    tenantId: string,
    data: {
      name: string;
      description?: string;
      imageUrl?: string;
      sortOrder?: number;
      slug?: string;
    },
  ) {
    const slug = data.slug || slugify(data.name);
    try {
      return await this.prisma.category.create({
        data: {
          tenantId,
          name: data.name,
          slug,
          description: data.description,
          imageUrl: data.imageUrl,
          sortOrder: data.sortOrder ?? 0,
        },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('Slug de categoria já existe');
      }
      throw e;
    }
  }

  async updateCategory(
    tenantId: string,
    id: string,
    data: Partial<{
      name: string;
      description: string | null;
      imageUrl: string | null;
      sortOrder: number;
      isActive: boolean;
      slug: string;
    }>,
  ) {
    await this.ensureCategory(tenantId, id);
    return this.prisma.category.update({ where: { id }, data });
  }

  async deleteCategory(tenantId: string, id: string) {
    await this.ensureCategory(tenantId, id);
    await this.prisma.category.delete({ where: { id } });
    return { ok: true };
  }

  // ── Products ────────────────────────────────────────────────────────────
  listProducts(tenantId: string, categoryId?: string) {
    return this.prisma.product.findMany({
      where: {
        tenantId,
        ...(categoryId ? { categoryId } : {}),
      },
      orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }],
      include: {
        category: { select: { id: true, name: true } },
        productAddons: { include: { addon: true } },
      },
    });
  }

  async createProduct(
    tenantId: string,
    data: {
      name: string;
      description?: string;
      priceCents: number;
      promoPriceCents?: number;
      categoryId?: string;
      imageUrl?: string;
      isFeatured?: boolean;
      prepMinutes?: number;
      variations?: Prisma.InputJsonValue;
      addonIds?: string[];
      slug?: string;
    },
  ) {
    const slug = data.slug || slugify(data.name);
    const product = await this.prisma.product.create({
      data: {
        tenantId,
        name: data.name,
        slug,
        description: data.description,
        priceCents: data.priceCents,
        promoPriceCents: data.promoPriceCents,
        categoryId: data.categoryId,
        imageUrl: data.imageUrl,
        isFeatured: data.isFeatured ?? false,
        prepMinutes: data.prepMinutes,
        variations: data.variations ?? [],
      },
    });
    if (data.addonIds?.length) {
      await this.prisma.productAddon.createMany({
        data: data.addonIds.map((addonId) => ({
          productId: product.id,
          addonId,
        })),
        skipDuplicates: true,
      });
    }
    return this.prisma.product.findUnique({
      where: { id: product.id },
      include: { productAddons: { include: { addon: true } } },
    });
  }

  async updateProduct(
    tenantId: string,
    id: string,
    data: Partial<{
      name: string;
      description: string | null;
      priceCents: number;
      promoPriceCents: number | null;
      categoryId: string | null;
      imageUrl: string | null;
      isFeatured: boolean;
      isActive: boolean;
      isAvailable: boolean;
      prepMinutes: number | null;
      variations: Prisma.InputJsonValue;
      sortOrder: number;
      addonIds: string[];
    }>,
  ) {
    await this.ensureProduct(tenantId, id);
    const { addonIds, ...rest } = data;
    await this.prisma.product.update({ where: { id }, data: rest });
    if (addonIds) {
      await this.prisma.productAddon.deleteMany({ where: { productId: id } });
      if (addonIds.length) {
        await this.prisma.productAddon.createMany({
          data: addonIds.map((addonId) => ({ productId: id, addonId })),
        });
      }
    }
    return this.prisma.product.findUnique({
      where: { id },
      include: { productAddons: { include: { addon: true } } },
    });
  }

  async deleteProduct(tenantId: string, id: string) {
    await this.ensureProduct(tenantId, id);
    await this.prisma.product.delete({ where: { id } });
    return { ok: true };
  }

  // ── Addons ──────────────────────────────────────────────────────────────
  listAddons(tenantId: string) {
    return this.prisma.addon.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
  }

  createAddon(
    tenantId: string,
    data: { name: string; priceCents: number; maxQty?: number },
  ) {
    return this.prisma.addon.create({
      data: {
        tenantId,
        name: data.name,
        priceCents: data.priceCents,
        maxQty: data.maxQty ?? 1,
      },
    });
  }

  async updateAddon(
    tenantId: string,
    id: string,
    data: Partial<{
      name: string;
      priceCents: number;
      maxQty: number;
      isActive: boolean;
    }>,
  ) {
    const addon = await this.prisma.addon.findFirst({ where: { id, tenantId } });
    if (!addon) throw new NotFoundException('Adicional não encontrado');
    return this.prisma.addon.update({ where: { id }, data });
  }

  async deleteAddon(tenantId: string, id: string) {
    const addon = await this.prisma.addon.findFirst({ where: { id, tenantId } });
    if (!addon) throw new NotFoundException('Adicional não encontrado');
    await this.prisma.addon.delete({ where: { id } });
    return { ok: true };
  }

  // ── Combos ──────────────────────────────────────────────────────────────
  listCombos(tenantId: string) {
    return this.prisma.combo.findMany({
      where: { tenantId },
      include: { items: { include: { product: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async createCombo(
    tenantId: string,
    data: {
      name: string;
      description?: string;
      priceCents: number;
      imageUrl?: string;
      items: Array<{ productId: string; quantity?: number }>;
    },
  ) {
    return this.prisma.combo.create({
      data: {
        tenantId,
        name: data.name,
        description: data.description,
        priceCents: data.priceCents,
        imageUrl: data.imageUrl,
        items: {
          create: data.items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity ?? 1,
          })),
        },
      },
      include: { items: { include: { product: true } } },
    });
  }

  async updateCombo(
    tenantId: string,
    id: string,
    data: Partial<{
      name: string;
      description: string | null;
      priceCents: number;
      imageUrl: string | null;
      isActive: boolean;
      items: Array<{ productId: string; quantity?: number }>;
    }>,
  ) {
    const combo = await this.prisma.combo.findFirst({ where: { id, tenantId } });
    if (!combo) throw new NotFoundException('Combo não encontrado');
    const { items, ...rest } = data;
    if (items) {
      await this.prisma.comboItem.deleteMany({ where: { comboId: id } });
      await this.prisma.comboItem.createMany({
        data: items.map((i) => ({
          comboId: id,
          productId: i.productId,
          quantity: i.quantity ?? 1,
        })),
      });
    }
    return this.prisma.combo.update({
      where: { id },
      data: rest,
      include: { items: { include: { product: true } } },
    });
  }

  async deleteCombo(tenantId: string, id: string) {
    const combo = await this.prisma.combo.findFirst({ where: { id, tenantId } });
    if (!combo) throw new NotFoundException('Combo não encontrado');
    await this.prisma.combo.delete({ where: { id } });
    return { ok: true };
  }

  private async ensureCategory(tenantId: string, id: string) {
    const row = await this.prisma.category.findFirst({ where: { id, tenantId } });
    if (!row) throw new NotFoundException('Categoria não encontrada');
    return row;
  }

  private async ensureProduct(tenantId: string, id: string) {
    const row = await this.prisma.product.findFirst({ where: { id, tenantId } });
    if (!row) throw new NotFoundException('Produto não encontrado');
    return row;
  }
}
