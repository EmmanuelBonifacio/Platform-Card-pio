import { apiGet } from '@/lib/api';

type MenuResponse = {
  tenant: { name: string; slug: string; whatsappNumber?: string | null };
  categories: Array<{
    id: string;
    name: string;
    products: Array<{
      id: string;
      name: string;
      description?: string | null;
      priceCents: number;
      promoPriceCents?: number | null;
      isFeatured: boolean;
    }>;
  }>;
};

function brl(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
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
    error = e instanceof Error ? e.message : 'Falha ao carregar cardápio';
  }

  if (error || !menu) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Cardápio indisponível</h1>
        <p className="mt-2 text-neutral-600">{error ?? 'Sem dados'}</p>
        <p className="mt-4 text-sm text-neutral-500">
          Suba a API e rode o seed (`demo-burger`).
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f3f6f4]">
      <header className="border-b border-emerald-900/10 bg-white">
        <div className="mx-auto max-w-3xl px-4 py-8">
          <p className="text-xs uppercase tracking-widest text-emerald-700">
            Platform Cardápio
          </p>
          <h1 className="mt-1 text-3xl font-semibold text-neutral-900">
            {menu.tenant.name}
          </h1>
        </div>
      </header>
      <div className="mx-auto max-w-3xl space-y-8 px-4 py-8">
        {menu.categories.map((cat) => (
          <section key={cat.id}>
            <h2 className="mb-4 text-xl font-semibold text-emerald-900">
              {cat.name}
            </h2>
            <ul className="space-y-3">
              {cat.products.map((p) => (
                <li
                  key={p.id}
                  className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-medium text-neutral-900">
                        {p.name}
                        {p.isFeatured ? (
                          <span className="ml-2 text-xs text-emerald-700">
                            destaque
                          </span>
                        ) : null}
                      </h3>
                      {p.description ? (
                        <p className="mt-1 text-sm text-neutral-600">
                          {p.description}
                        </p>
                      ) : null}
                    </div>
                    <p className="shrink-0 font-semibold text-emerald-800">
                      {brl(p.promoPriceCents ?? p.priceCents)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
