'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiGet, apiPost } from '@/lib/api';
import { getToken } from '@/lib/auth';

type Order = {
  id: string;
  number: number;
  status: string;
  totalCents: number;
  type: string;
  creditDebited: boolean;
  notes?: string | null;
  customer?: { name?: string | null; phone: string } | null;
  itemsJson: Array<{ name: string; quantity: number; unitPriceCents: number }>;
  createdAt: string;
};

const COLUMNS = [
  { key: 'PENDING', title: 'Novos' },
  { key: 'ACCEPTED', title: 'Aceitos' },
  { key: 'PREPARING', title: 'Preparando' },
  { key: 'READY', title: 'Prontos' },
  { key: 'OUT_FOR_DELIVERY', title: 'Entrega' },
  { key: 'DELIVERED', title: 'Entregues' },
] as const;

function brl(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export default function PedidosKanbanPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setError('Faça login em /painel');
      return;
    }
    try {
      const data = await apiGet<Order[]>('/orders', token);
      setOrders(data);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar');
    }
  }, []);

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), 8000);
    return () => clearInterval(t);
  }, [load]);

  const byStatus = useMemo(() => {
    const map: Record<string, Order[]> = {};
    for (const c of COLUMNS) map[c.key] = [];
    for (const o of orders) {
      if (!map[o.status]) map[o.status] = [];
      map[o.status].push(o);
    }
    return map;
  }, [orders]);

  async function accept(id: string) {
    const token = getToken();
    if (!token) return;
    setBusy(id);
    try {
      await apiPost(`/orders/${id}/accept`, {}, token);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao aceitar');
    } finally {
      setBusy(null);
    }
  }

  async function reject(id: string) {
    const token = getToken();
    if (!token) return;
    setBusy(id);
    try {
      await apiPost(`/orders/${id}/reject`, { reason: 'Indisponível' }, token);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao rejeitar');
    } finally {
      setBusy(null);
    }
  }

  async function advance(id: string, status: string) {
    const token = getToken();
    if (!token) return;
    setBusy(id);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3010/api'}/orders/${id}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        },
      );
      if (!res.ok) throw new Error(await res.text());
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao atualizar');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900">Pedidos</h1>
        <button
          onClick={() => void load()}
          className="rounded-full border px-4 py-1.5 text-sm"
        >
          Atualizar
        </button>
      </div>
      {error ? (
        <p className="mb-4 whitespace-pre-wrap rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      <div className="flex gap-3 overflow-x-auto pb-4">
        {COLUMNS.map((col) => (
          <div
            key={col.key}
            className="w-72 shrink-0 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-black/5"
          >
            <h2 className="mb-3 text-sm font-semibold text-emerald-900">
              {col.title}{' '}
              <span className="text-neutral-400">
                ({byStatus[col.key]?.length ?? 0})
              </span>
            </h2>
            <div className="space-y-3">
              {(byStatus[col.key] ?? []).map((o) => (
                <article
                  key={o.id}
                  className="rounded-xl border border-neutral-100 bg-[#fafcfa] p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">#{o.number}</p>
                      <p className="text-xs text-neutral-500">
                        {o.customer?.name || o.customer?.phone || 'Cliente'} ·{' '}
                        {o.type}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-emerald-800">
                      {brl(o.totalCents)}
                    </p>
                  </div>
                  <ul className="mt-2 space-y-0.5 text-xs text-neutral-600">
                    {o.itemsJson?.slice(0, 4).map((it, idx) => (
                      <li key={idx}>
                        {it.quantity}x {it.name}
                      </li>
                    ))}
                  </ul>
                  {o.creditDebited ? (
                    <p className="mt-2 text-[10px] uppercase tracking-wide text-emerald-700">
                      crédito debitado
                    </p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {o.status === 'PENDING' ? (
                      <>
                        <button
                          disabled={busy === o.id}
                          onClick={() => void accept(o.id)}
                          className="rounded-full bg-emerald-600 px-3 py-1 text-xs text-white"
                        >
                          Aceitar
                        </button>
                        <button
                          disabled={busy === o.id}
                          onClick={() => void reject(o.id)}
                          className="rounded-full bg-neutral-200 px-3 py-1 text-xs"
                        >
                          Rejeitar
                        </button>
                      </>
                    ) : null}
                    {o.status === 'ACCEPTED' ? (
                      <button
                        disabled={busy === o.id}
                        onClick={() => void advance(o.id, 'PREPARING')}
                        className="rounded-full bg-emerald-600 px-3 py-1 text-xs text-white"
                      >
                        Preparar
                      </button>
                    ) : null}
                    {o.status === 'PREPARING' ? (
                      <button
                        disabled={busy === o.id}
                        onClick={() => void advance(o.id, 'READY')}
                        className="rounded-full bg-emerald-600 px-3 py-1 text-xs text-white"
                      >
                        Pronto
                      </button>
                    ) : null}
                    {o.status === 'READY' ? (
                      <button
                        disabled={busy === o.id}
                        onClick={() =>
                          void advance(
                            o.id,
                            o.type === 'DELIVERY'
                              ? 'OUT_FOR_DELIVERY'
                              : 'DELIVERED',
                          )
                        }
                        className="rounded-full bg-emerald-600 px-3 py-1 text-xs text-white"
                      >
                        {o.type === 'DELIVERY' ? 'Saiu' : 'Entregar'}
                      </button>
                    ) : null}
                    {o.status === 'OUT_FOR_DELIVERY' ? (
                      <button
                        disabled={busy === o.id}
                        onClick={() => void advance(o.id, 'DELIVERED')}
                        className="rounded-full bg-emerald-600 px-3 py-1 text-xs text-white"
                      >
                        Entregue
                      </button>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
