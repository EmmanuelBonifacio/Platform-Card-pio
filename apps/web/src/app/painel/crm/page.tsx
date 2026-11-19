'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiGet, apiPatch } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { brl } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type Customer = {
  id: string;
  name?: string | null;
  phone: string;
  segment?: string | null;
  loyaltyScore: number;
  totalOrders: number;
  totalSpentCents: number;
  loyalty?: {
    points: number;
    cashbackCents: number;
    stamps: number;
    tier: string;
  } | null;
};

type Segments = {
  total: number;
  vip: number;
  ativos: number;
  risco: number;
  novos: number;
};

export default function CrmPage() {
  const { token } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [segments, setSegments] = useState<Segments | null>(null);
  const [q, setQ] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const [list, seg] = await Promise.all([
        apiGet<Customer[]>(
          `/crm/customers${q ? `?q=${encodeURIComponent(q)}` : ''}`,
          token,
        ),
        apiGet<Segments>('/crm/segments', token),
      ]);
      setCustomers(list);
      setSegments(seg);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro');
    }
  }, [token, q]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">CRM</h1>
        <p className="text-pc-muted">
          Clientes, score e fidelidade (pontos / cashback / VIP).
        </p>
      </div>
      {error ? <p className="text-sm text-pc-danger">{error}</p> : null}
      {segments ? (
        <div className="grid gap-3 sm:grid-cols-5">
          {(
            [
              ['Total', segments.total],
              ['VIP', segments.vip],
              ['Ativos', segments.ativos],
              ['Em risco', segments.risco],
              ['Novos', segments.novos],
            ] as const
          ).map(([label, n]) => (
            <div key={label} className="pc-card rounded-[1.25rem] p-4 text-center">
              <p className="text-xs uppercase tracking-wider text-pc-muted">
                {label}
              </p>
              <p className="font-display mt-1 text-2xl font-bold">{n}</p>
            </div>
          ))}
        </div>
      ) : null}
      <div className="flex gap-2">
        <input
          className="pc-input max-w-sm"
          placeholder="Buscar nome, telefone…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <Button variant="ghost" onClick={() => void load()}>
          Buscar
        </Button>
      </div>
      <ul className="space-y-2">
        {customers.map((c) => (
          <li
            key={c.id}
            className="pc-card flex flex-wrap items-center justify-between gap-3 rounded-[1.25rem] p-4"
          >
            <div>
              <p className="font-semibold">{c.name || c.phone}</p>
              <p className="text-xs text-pc-muted">
                {c.phone} · score {c.loyaltyScore} · {c.totalOrders} pedidos ·{' '}
                {brl(c.totalSpentCents)}
                {c.loyalty
                  ? ` · ${c.loyalty.tier} · ${c.loyalty.points} pts · cashback ${brl(c.loyalty.cashbackCents)}`
                  : ''}
              </p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() =>
                void apiPatch(
                  `/crm/customers/${c.id}`,
                  { segment: 'vip', marketingOptIn: true },
                  token!,
                ).then(load)
              }
            >
              Marcar VIP
            </Button>
          </li>
        ))}
        {!customers.length ? (
          <li className="text-sm text-pc-muted">Nenhum cliente ainda.</li>
        ) : null}
      </ul>
    </div>
  );
}
