'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { apiGet, apiPatch, apiPost } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { brl } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type Order = {
  id: string;
  number: number;
  status: string;
  totalCents: number;
  type: string;
  creditDebited: boolean;
  customer?: { name?: string | null; phone: string } | null;
  itemsJson: Array<{ name: string; quantity: number; unitPriceCents: number }>;
  createdAt: string;
};

const COLUMNS = [
  { key: 'PENDING', title: 'Novos', tone: 'from-amber-100 to-white' },
  { key: 'ACCEPTED', title: 'Aceitos', tone: 'from-lime-100 to-white' },
  { key: 'PREPARING', title: 'Preparando', tone: 'from-emerald-50 to-white' },
  { key: 'READY', title: 'Prontos', tone: 'from-sky-50 to-white' },
  { key: 'OUT_FOR_DELIVERY', title: 'Entrega', tone: 'from-violet-50 to-white' },
  { key: 'DELIVERED', title: 'Entregues', tone: 'from-stone-100 to-white' },
] as const;

export default function PedidosKanbanPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setOrders(await apiGet<Order[]>('/orders', token));
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar');
    }
  }, [token]);

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), 7000);
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
    if (!token) return;
    setBusy(id);
    try {
      await apiPatch(`/orders/${id}/status`, { status }, token);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao atualizar');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <div className="mb-5 flex items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-pc-ink">Pedidos</h1>
          <p className="text-sm text-pc-muted">
            Aceite para debitar crédito · atualiza a cada 7s
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => void load()}>
          Atualizar
        </Button>
      </div>

      {error ? (
        <p className="mb-4 whitespace-pre-wrap rounded-2xl bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="flex gap-3 overflow-x-auto pb-4">
        {COLUMNS.map((col) => (
          <div
            key={col.key}
            className={`w-72 shrink-0 rounded-[1.5rem] bg-gradient-to-b ${col.tone} p-3 ring-1 ring-pc-stone/70`}
          >
            <h2 className="mb-3 text-sm font-semibold text-pc-forest">
              {col.title}{' '}
              <span className="text-pc-muted">
                ({byStatus[col.key]?.length ?? 0})
              </span>
            </h2>
            <div className="space-y-3">
              {(byStatus[col.key] ?? []).map((o) => (
                <motion.article
                  key={o.id}
                  layout
                  className="rounded-[1.2rem] bg-white/90 p-3 shadow-sm ring-1 ring-black/5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-display text-lg font-bold">#{o.number}</p>
                      <p className="text-xs text-pc-muted">
                        {o.customer?.name || o.customer?.phone || 'Cliente'} ·{' '}
                        {o.type}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-pc-forest">
                      {brl(o.totalCents)}
                    </p>
                  </div>
                  <ul className="mt-2 space-y-0.5 text-xs text-pc-muted">
                    {o.itemsJson?.slice(0, 4).map((it, idx) => (
                      <li key={idx}>
                        {it.quantity}x {it.name}
                      </li>
                    ))}
                  </ul>
                  {o.creditDebited ? (
                    <p className="mt-2 text-[10px] font-bold uppercase tracking-wide text-pc-leaf">
                      crédito debitado
                    </p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {o.status === 'PENDING' ? (
                      <>
                        <Button
                          size="sm"
                          variant="lime"
                          disabled={busy === o.id}
                          onClick={() => void accept(o.id)}
                        >
                          Aceitar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={busy === o.id}
                          onClick={() => void reject(o.id)}
                        >
                          Rejeitar
                        </Button>
                      </>
                    ) : null}
                    {o.status === 'ACCEPTED' ? (
                      <Button
                        size="sm"
                        disabled={busy === o.id}
                        onClick={() => void advance(o.id, 'PREPARING')}
                      >
                        Preparar
                      </Button>
                    ) : null}
                    {o.status === 'PREPARING' ? (
                      <Button
                        size="sm"
                        disabled={busy === o.id}
                        onClick={() => void advance(o.id, 'READY')}
                      >
                        Pronto
                      </Button>
                    ) : null}
                    {o.status === 'READY' ? (
                      <Button
                        size="sm"
                        disabled={busy === o.id}
                        onClick={() =>
                          void advance(
                            o.id,
                            o.type === 'DELIVERY'
                              ? 'OUT_FOR_DELIVERY'
                              : 'DELIVERED',
                          )
                        }
                      >
                        {o.type === 'DELIVERY' ? 'Saiu' : 'Entregar'}
                      </Button>
                    ) : null}
                    {o.status === 'OUT_FOR_DELIVERY' ? (
                      <Button
                        size="sm"
                        disabled={busy === o.id}
                        onClick={() => void advance(o.id, 'DELIVERED')}
                      >
                        Entregue
                      </Button>
                    ) : null}
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
