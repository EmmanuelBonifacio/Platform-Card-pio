'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiGet, apiPatch, apiPost } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';

type Store = {
  id: string;
  name: string;
  slug: string;
  phone?: string | null;
  isActive: boolean;
  _count?: { orders: number };
};

export default function LojasPage() {
  const { token } = useAuth();
  const [stores, setStores] = useState<Store[]>([]);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setStores(await apiGet<Store[]>('/stores', token));
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro');
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  async function create() {
    if (!token) return;
    try {
      await apiPost('/stores', { name, slug }, token);
      setName('');
      setSlug('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha');
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Multi-loja</h1>
        <p className="text-pc-muted">
          Filiais da rede sob o mesmo tenant (billing compartilhado).
        </p>
      </div>
      {error ? <p className="text-sm text-pc-danger">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <input
          className="pc-input max-w-[12rem]"
          placeholder="Nome"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="pc-input max-w-[10rem]"
          placeholder="slug"
          value={slug}
          onChange={(e) =>
            setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
          }
        />
        <Button onClick={() => void create()}>Adicionar</Button>
      </div>
      <ul className="space-y-2">
        {stores.map((s) => (
          <li
            key={s.id}
            className="pc-card flex flex-wrap items-center justify-between gap-3 rounded-[1.25rem] p-4"
          >
            <div>
              <p className="font-semibold">{s.name}</p>
              <p className="text-xs text-pc-muted">
                /{s.slug} · {s._count?.orders ?? 0} pedidos ·{' '}
                {s.isActive ? 'ativa' : 'pausada'}
              </p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() =>
                void apiPatch(
                  `/stores/${s.id}`,
                  { isActive: !s.isActive },
                  token!,
                ).then(load)
              }
            >
              {s.isActive ? 'Pausar' : 'Ativar'}
            </Button>
          </li>
        ))}
        {!stores.length ? (
          <li className="text-sm text-pc-muted">Nenhuma filial cadastrada.</li>
        ) : null}
      </ul>
    </div>
  );
}
