'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
  apiUpload,
} from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { brl } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type Category = { id: string; name: string; slug: string };
type Product = {
  id: string;
  name: string;
  priceCents: number;
  isAvailable: boolean;
  isFeatured: boolean;
  imageUrl?: string | null;
  category?: { name: string } | null;
};
type Addon = { id: string; name: string; priceCents: number; isActive: boolean };

export default function CardapioAdminPage() {
  const { token } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [catName, setCatName] = useState('');
  const [prodName, setProdName] = useState('');
  const [price, setPrice] = useState('29.90');
  const [categoryId, setCategoryId] = useState('');
  const [addonName, setAddonName] = useState('');
  const [addonPrice, setAddonPrice] = useState('2.00');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    if (!token) return;
    const [c, p, a] = await Promise.all([
      apiGet<Category[]>('/catalog/categories', token),
      apiGet<Product[]>('/catalog/products', token),
      apiGet<Addon[]>('/catalog/addons', token),
    ]);
    setCategories(c);
    setProducts(p);
    setAddons(a);
    if (!categoryId && c[0]) setCategoryId(c[0].id);
  }, [token, categoryId]);

  useEffect(() => {
    void load().catch((e) => setError(e instanceof Error ? e.message : 'Erro'));
  }, [load]);

  async function createCategory() {
    if (!token || !catName.trim()) return;
    await apiPost('/catalog/categories', { name: catName }, token);
    setCatName('');
    setMsg('Categoria criada');
    await load();
  }

  async function createProduct() {
    if (!token || !prodName.trim()) return;
    const priceCents = Math.round(Number(price.replace(',', '.')) * 100);
    await apiPost(
      '/catalog/products',
      {
        name: prodName,
        priceCents,
        categoryId: categoryId || undefined,
      },
      token,
    );
    setProdName('');
    setMsg('Produto criado');
    await load();
  }

  async function createAddon() {
    if (!token || !addonName.trim()) return;
    const priceCents = Math.round(Number(addonPrice.replace(',', '.')) * 100);
    await apiPost(
      '/catalog/addons',
      { name: addonName, priceCents },
      token,
    );
    setAddonName('');
    setMsg('Adicional criado');
    await load();
  }

  async function toggleAvailable(p: Product) {
    if (!token) return;
    await apiPatch(
      `/catalog/products/${p.id}`,
      { isAvailable: !p.isAvailable },
      token,
    );
    await load();
  }

  async function uploadImage(p: Product, file: File) {
    if (!token) return;
    setMsg('Enviando imagem…');
    const up = await apiUpload<{ url: string }>('/uploads/image', file, token);
    await apiPatch(`/catalog/products/${p.id}`, { imageUrl: up.url }, token);
    setMsg('Imagem atualizada');
    await load();
  }

  async function removeProduct(id: string) {
    if (!token) return;
    await apiDelete(`/catalog/products/${id}`, token);
    await load();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-extrabold text-pc-ink">Cardápio</h1>
        <p className="text-sm text-pc-muted">
          Categorias, produtos, adicionais e fotos
        </p>
      </div>
      {error ? <p className="text-sm text-pc-danger">{error}</p> : null}
      {msg ? <p className="text-sm text-pc-leaf">{msg}</p> : null}

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="pc-card rounded-[1.5rem] p-5">
          <h2 className="font-display text-lg font-bold">Categoria</h2>
          <div className="mt-3 flex gap-2">
            <input
              className="pc-input"
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              placeholder="Ex: Bebidas"
            />
            <Button onClick={() => void createCategory()}>Criar</Button>
          </div>
          <ul className="mt-4 space-y-1 text-sm text-pc-muted">
            {categories.map((c) => (
              <li key={c.id}>
                {c.name} <span className="opacity-60">({c.slug})</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="pc-card rounded-[1.5rem] p-5">
          <h2 className="font-display text-lg font-bold">Produto</h2>
          <div className="mt-3 space-y-2">
            <input
              className="pc-input"
              value={prodName}
              onChange={(e) => setProdName(e.target.value)}
              placeholder="Nome"
            />
            <input
              className="pc-input"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Preço"
            />
            <select
              className="pc-input"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">Sem categoria</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <Button className="w-full" onClick={() => void createProduct()}>
              Criar produto
            </Button>
          </div>
        </div>

        <div className="pc-card rounded-[1.5rem] p-5">
          <h2 className="font-display text-lg font-bold">Adicional</h2>
          <div className="mt-3 space-y-2">
            <input
              className="pc-input"
              value={addonName}
              onChange={(e) => setAddonName(e.target.value)}
              placeholder="Ex: Bacon"
            />
            <input
              className="pc-input"
              value={addonPrice}
              onChange={(e) => setAddonPrice(e.target.value)}
              placeholder="Preço"
            />
            <Button className="w-full" variant="lime" onClick={() => void createAddon()}>
              Criar adicional
            </Button>
          </div>
          <ul className="mt-4 space-y-1 text-sm text-pc-muted">
            {addons.map((a) => (
              <li key={a.id}>
                {a.name} · {brl(a.priceCents)}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="pc-card rounded-[1.5rem] p-5">
        <h2 className="font-display text-lg font-bold">Produtos publicados</h2>
        <ul className="mt-4 divide-y divide-pc-stone/80">
          {products.map((p) => (
            <li
              key={p.id}
              className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 overflow-hidden rounded-2xl bg-pc-paper ring-1 ring-pc-stone">
                  {p.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={
                        p.imageUrl.startsWith('http')
                          ? p.imageUrl
                          : `${process.env.NEXT_PUBLIC_API_URL?.replace(/\/api$/, '') ?? 'http://localhost:3010'}${p.imageUrl}`
                      }
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>
                <div>
                  <p className="font-semibold text-pc-ink">{p.name}</p>
                  <p className="text-sm text-pc-muted">
                    {p.category?.name ?? '—'} · {brl(p.priceCents)}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <label className="pc-btn pc-btn-ghost cursor-pointer px-3 py-1.5 text-xs">
                  Foto
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void uploadImage(p, f);
                    }}
                  />
                </label>
                <Button
                  size="sm"
                  variant={p.isAvailable ? 'lime' : 'ghost'}
                  onClick={() => void toggleAvailable(p)}
                >
                  {p.isAvailable ? 'Disponível' : 'Pausado'}
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => void removeProduct(p.id)}
                >
                  Excluir
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
