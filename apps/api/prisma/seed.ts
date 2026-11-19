import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const plans = [
    {
      code: 'iniciante',
      name: 'Iniciante',
      description: 'Até 100 pedidos por ciclo de 30 dias',
      priceCents: 7990,
      orderLimit: 100,
      sortOrder: 1,
      features: [
        'Cardápio Digital',
        'Gestão de Pedidos',
        'Bot WhatsApp',
        'Relatórios',
        'Plano de Fidelidade',
        'Subdomínio próprio',
        'Pixel de rastreamento',
      ],
    },
    {
      code: 'essencial',
      name: 'Essencial',
      description: 'Até 400 pedidos por ciclo de 30 dias',
      priceCents: 13990,
      orderLimit: 400,
      sortOrder: 2,
      features: [
        'Cardápio Digital',
        'Gestão de Pedidos',
        'Bot WhatsApp',
        'Relatórios',
        'Plano de Fidelidade',
        'Subdomínio próprio',
        'Pixel de rastreamento',
      ],
    },
    {
      code: 'premium',
      name: 'Premium',
      description: 'Pedidos ilimitados no ciclo de 30 dias',
      priceCents: 24990,
      orderLimit: null as number | null,
      sortOrder: 3,
      features: [
        'Cardápio Digital',
        'Gestão de Pedidos',
        'Bot WhatsApp',
        'Relatórios',
        'Plano de Fidelidade',
        'Subdomínio próprio',
        'Pixel de rastreamento',
        'Pedidos Ilimitados',
      ],
    },
  ];

  for (const p of plans) {
    await prisma.plan.upsert({
      where: { code: p.code },
      create: { ...p, features: p.features },
      update: {
        name: p.name,
        description: p.description,
        priceCents: p.priceCents,
        orderLimit: p.orderLimit,
        features: p.features,
        sortOrder: p.sortOrder,
      },
    });
  }

  const passwordHash = await bcrypt.hash('admin123_TROQUE', 12);
  await prisma.user.upsert({
    where: { email: 'admin@platformcardapio.com' },
    create: {
      email: 'admin@platformcardapio.com',
      name: 'Super Admin',
      role: 'SUPER_ADMIN',
      passwordHash,
    },
    update: { passwordHash },
  });

  const demoPlan = await prisma.plan.findUniqueOrThrow({
    where: { code: 'essencial' },
  });

  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo-burger' },
    create: {
      name: 'Demo Burger',
      slug: 'demo-burger',
      subdomain: 'demo-burger',
      email: 'loja@demo.com',
      status: 'ACTIVE',
      whatsappNumber: '5534999999999',
    },
    update: {},
  });

  await prisma.user.upsert({
    where: { email: 'loja@demo.com' },
    create: {
      tenantId: tenant.id,
      email: 'loja@demo.com',
      name: 'Lojista Demo',
      role: 'TENANT_OWNER',
      passwordHash: await bcrypt.hash('loja123_TROQUE', 12),
    },
    update: { tenantId: tenant.id },
  });

  const startsAt = new Date();
  const endsAt = new Date(startsAt);
  endsAt.setDate(endsAt.getDate() + 30);

  const existingCycle = await prisma.creditCycle.findFirst({
    where: { tenantId: tenant.id, status: 'ACTIVE' },
  });

  const cycle =
    existingCycle ??
    (await prisma.creditCycle.create({
      data: {
        tenantId: tenant.id,
        planId: demoPlan.id,
        startsAt,
        endsAt,
        orderLimit: demoPlan.orderLimit,
        consumed: 0,
        origin: 'TRIAL',
        status: 'ACTIVE',
      },
    }));

  await prisma.subscription.upsert({
    where: { tenantId: tenant.id },
    create: {
      tenantId: tenant.id,
      planId: demoPlan.id,
      status: 'ACTIVE',
      currentCycleId: cycle.id,
    },
    update: {
      planId: demoPlan.id,
      currentCycleId: cycle.id,
      status: 'ACTIVE',
    },
  });

  const cat = await prisma.category.upsert({
    where: { tenantId_slug: { tenantId: tenant.id, slug: 'burgers' } },
    create: {
      tenantId: tenant.id,
      name: 'Burgers',
      slug: 'burgers',
      sortOrder: 1,
    },
    update: {},
  });

  await prisma.product.upsert({
    where: { tenantId_slug: { tenantId: tenant.id, slug: 'classic-burger' } },
    create: {
      tenantId: tenant.id,
      categoryId: cat.id,
      name: 'Classic Burger',
      slug: 'classic-burger',
      description: 'Pão, blend 160g, queijo e molho da casa',
      priceCents: 2890,
      isFeatured: true,
    },
    update: {},
  });

  // eslint-disable-next-line no-console
  console.log('Seed OK — plans + demo-burger + admin@platformcardapio.com');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
