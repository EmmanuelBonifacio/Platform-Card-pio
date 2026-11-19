'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiGet, apiPatch } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { brl } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type Order = {
  id: string;
  number: number;
  status: string;
  totalCents: number;
  type: string;
  notes?: string | null;
  customer?: { name?: string | null; phone: string } | null;
  itemsJson: Array<{ name: string; quantity: number; unitPriceCents: number }>;
  createdAt: string;
};

const ACTIVE = new Set(['ACCEPTED', 'PREPARING', 'READY']);

export default function CozinhaPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const all = await apiGet<Order[]>('/orders', token);
      setOrders(all.filter((o) => ACTIVE.has(o.status)));
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro');
    }
  }, [token]);

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), 5000);
    return () => clearInterval(t);
  }, [load]);

  async function mark(id: string, status: string) {
    if (!token) return;
    await apiPatch(`/orders/${id}/status`, { status }, token);
    await load();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3 print:hidden">
        <div>
          <h1 className="font-display text-3xl font-bold">Cozinha / KDS</h1>
          <p className="text-pc-muted">Pedidos ativos para preparação e impressão.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => void load()}>
            Atualizar
          </Button>
          <Button variant="lime" onClick={() => window.print()}>
            Imprimir
          </Button>
        </div>
      </div>
      {error ? (
        <p className="text-sm text-pc-danger print:hidden">{error}</p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 print:grid-cols-1">
        {orders.map((o) => (
          <article
            key={o.id}
            className="pc-card break-inside-avoid rounded-[1.25rem] p-5 print:border print:shadow-none"
          >
            <header className="flex items-start justify-between gap-2">
              <div>
                <p className="font-display text-3xl font-extrabold">#{o.number}</p>
                <p className="text-xs uppercase tracking-wider text-pc-muted">
                  {o.type} · {o.status}
                </p>
              </div>
              <p className="font-semibold text-pc-forest">{brl(o.totalCents)}</p>
            </header>
            <ul className="mt-4 space-y-1 text-sm">
              {o.itemsJson.map((it, idx) => (
                <li key={`${o.id}-${idx}`}>
                  <strong>{it.quantity}x</strong> {it.name}
                </li>
              ))}
            </ul>
            {o.notes ? (
              <p className="mt-3 rounded-xl bg-pc-paper px-3 py-2 text-sm">
                Obs: {o.notes}
              </p>
            ) : null}
            <p className="mt-3 text-xs text-pc-muted">
              {o.customer?.name || o.customer?.phone || 'Cliente'}
            </p>
            <div className="mt-4 flex flex-wrap gap-2 print:hidden">
              {o.status === 'ACCEPTED' ? (
                <Button size="sm" onClick={() => void mark(o.id, 'PREPARING')}>
                  Preparar
                </Button>
              ) : null}
              {o.status === 'PREPARING' ? (
                <Button size="sm" variant="lime" onClick={() => void mark(o.id, 'READY')}>
                  Pronto
                </Button>
              ) : null}
            </div>
          </article>
        ))}
        {!orders.length ? (
          <p className="text-pc-muted">Nenhum pedido na cozinha agora.</p>
        ) : null}
      </div>

      </div>
  );
}
