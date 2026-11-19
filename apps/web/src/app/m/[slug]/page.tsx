import type { Metadata } from 'next';
import { MenuExperience } from '@/components/menu/MenuExperience';
import { apiGet } from '@/lib/api';

type MenuResponse = {
  tenant: {
    name: string;
    slug: string;
    logoUrl?: string | null;
    whatsappNumber?: string | null;
  };
  categories: Array<{
    id: string;
    name: string;
    products: Array<{
      id: string;
      name: string;
      description?: string | null;
      priceCents: number;
      promoPriceCents?: number | null;
      imageUrl?: string | null;
      isFeatured: boolean;
      productAddons?: Array<{
        addon: { id: string; name: string; priceCents: number };
      }>;
    }>;
  }>;
  combos: Array<{
    id: string;
    name: string;
    description?: string | null;
    priceCents: number;
    imageUrl?: string | null;
  }>;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const menu = await apiGet<MenuResponse>(`/public/${slug}/menu`);
    return {
      title: `${menu.tenant.name} — cardápio digital`,
      description: `Peça online no ${menu.tenant.name} com Platform Cardápio.`,
      openGraph: {
        title: menu.tenant.name,
        description: `Cardápio digital de ${menu.tenant.name}`,
      },
      alternates: { canonical: `/m/${slug}` },
    };
  } catch {
    return { title: 'Cardápio' };
  }
}

export default async function PublicMenuPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let menu: MenuResponse | null = null;
  let error: string | null = null;
  try {
    menu = await apiGet<MenuResponse>(`/public/${slug}/menu`);
  } catch (e) {
    error = e instanceof Error ? e.message : 'Falha ao carregar';
  }

  if (error || !menu) {
    return (
      <main className="pc-grain flex min-h-screen items-center justify-center px-6">
        <div className="pc-card max-w-md rounded-[2rem] p-8 text-center">
          <h1 className="font-display text-2xl font-bold">Cardápio offline</h1>
          <p className="mt-2 text-pc-muted">{error}</p>
          <p className="mt-4 text-sm text-pc-muted">
            Suba a API e rode o seed (`demo-burger`).
          </p>
        </div>
      </main>
    );
  }

  return <MenuExperience menu={menu} />;
}
