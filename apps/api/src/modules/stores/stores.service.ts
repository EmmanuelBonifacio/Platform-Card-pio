import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class StoresService {
  constructor(private readonly prisma: PrismaService) {}

  list(tenantId: string) {
    return this.prisma.storeLocation.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
      include: { _count: { select: { orders: true } } },
    });
  }

  create(
    tenantId: string,
    data: {
      name: string;
      slug: string;
      phone?: string;
      addressJson?: Prisma.InputJsonValue;
    },
  ) {
    return this.prisma.storeLocation.create({
      data: {
        tenantId,
        name: data.name.trim(),
        slug: data.slug.toLowerCase().trim(),
        phone: data.phone,
        addressJson: data.addressJson,
      },
    });
  }

  async update(
    tenantId: string,
    id: string,
    data: Partial<{
      name: string;
      phone: string | null;
      addressJson: Prisma.InputJsonValue;
      isActive: boolean;
    }>,
  ) {
    const row = await this.prisma.storeLocation.findFirst({
      where: { id, tenantId },
    });
    if (!row) throw new NotFoundException('Loja não encontrada');
    return this.prisma.storeLocation.update({ where: { id }, data });
  }

  async ensureBelongs(tenantId: string, storeLocationId?: string | null) {
    if (!storeLocationId) return;
    const row = await this.prisma.storeLocation.findFirst({
      where: { id: storeLocationId, tenantId, isActive: true },
    });
    if (!row) throw new BadRequestException('Loja inválida ou inativa');
  }
}
