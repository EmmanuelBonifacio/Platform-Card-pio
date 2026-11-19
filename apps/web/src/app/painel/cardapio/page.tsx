'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiGet, apiPost, API_URL } from '@/lib/api';
import { getToken } from '@/lib/auth';

type Category = { id: string; name: string; slug: string };
type Product = {
  id: string;
  name: string;
  priceCents: number;
  isAvailable: boolean;
  isFeatured: boolean;
  category?: { name: string } | null;
};

function brl(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export default function CardapioAdminPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [catName, setCatName] = useState('');
  const [prodName, setProdName] = useState('');
  const [price, setPrice] = useState('29.90');
  const [categoryId, setCategoryId] = useState('');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setError('Faça login em /painel');
      return;
    }
    const [c, p] = await Promise.all([
      apiGet<Category[]>('/catalog/categories', token),
      apiGet<Product[]>('/catalog/products', token),
    ]);
    setCategories(c);
    setProducts(p);
    if (!categoryId && c[0]) setCategoryId(c[0].id);
  }, [categoryId]);

  useEffect(() => {
    void load().catch((e) =>
      setError(e instanceof Error ? e.message : 'Erro'),
    );
  }, [load]);

  async function createCategory() {
    const token = getToken();
    if (!token) return;
    await apiPost('/catalog/categories', { name: catName }, token);
    setCatName('');
    setMsg('Categoria criada');
    await load();
  }

  async function createProduct() {
    const token = getToken();
    if (!token) return;
    const priceCents = Math.round(Number(price.replace(',', '.')) * 100);
    await apiPost(
      '/catalog/products',
      {
        name: prodName,
        priceCents,
        categoryId: categoryId || undefined,
        isFeatured: false,
      },
      token,
    );
    setProdName('');
    setMsg('Produto criado');
    await load();
  }

  async function toggleAvailable(p: Product) {
    const token = getToken();
    if (!token) return;
    const res = await fetch(`${API_URL}/catalog/products/${p.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ isAvailable: !p.isAvailable }),
    });
    if (!res.ok) throw new Error(await res.text());
    await load();
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Cardápio</h1>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {msg ? <p className="text-sm text-emerald-700">{msg}</p> : null}

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <h2 className="font-semibold">Nova categoria</h2>
          <div className="mt-3 flex gap-2">
            <input
              className="flex-1 rounded-xl border px-3 py-2"
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              placeholder="Ex: Bebidas"
            />
            <button
              onClick={() => void createCategory()}
              className="rounded-full bg-emerald-600 px-4 py-2 text-sm text-white"
            >
              Criar
            </button>
          </div>
          <ul className="mt-4 space-y-1 text-sm text-neutral-700">
            {categories.map((c) => (
              <li key={c.id}>
                {c.name}{' '}
                <span className="text-neutral-400">({c.slug})</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <h2 className="font-semibold">Novo produto</h2>
          <div className="mt-3 space-y-2">
            <input
              className="w-full rounded-xl border px-3 py-2"
              value={prodName}
              onChange={(e) => setProdName(e.target.value)}
              placeholder="Nome"
            />
            <input
              className="w-full rounded-xl border px-3 py-2"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Preço"
            />
            <select
              className="w-full rounded-xl border px-3 py-2"
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
            <button
              onClick={() => void createProduct()}
              className="rounded-full bg-emerald-600 px-4 py-2 text-sm text-white"
            >
              Criar produto
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
        <h2 className="font-semibold">Produtos</h2>
        <ul className="mt-4 divide-y">
          {products.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between gap-3 py-3"
            >
              <div>
                <p className="font-medium">
                  {p.name}{' '}
                  {p.isFeatured ? (
                    <span className="text-xs text-emerald-700">destaque</span>
                  ) : null}
                </p>
                <p className="text-sm text-neutral-500">
                  {p.category?.name ?? '—'} · {brl(p.priceCents)}
                </p>
              </div>
              <button
                onClick={() => void toggleAvailable(p)}
                className={
                  p.isAvailable
                    ? 'rounded-full bg-emerald-100 px-3 py-1 text-xs text-emerald-800'
                    : 'rounded-full bg-neutral-200 px-3 py-1 text-xs'
                }
              >
                {p.isAvailable ? 'Disponível' : 'Pausado'}
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
