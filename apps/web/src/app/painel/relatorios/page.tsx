'use client';

import { useCallback, useEffect, useState } from 'react';
import { API_URL, apiGet } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { brl } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type Dashboard = {
  periodDays: number;
  totals: {
    orders: number;
    accepted: number;
    revenueCents: number;
    ticketMedioCents: number;
  };
  byStatus: Record<string, number>;
  series: Array<{ date: string; orders: number; revenueCents: number }>;
  topCustomers: Array<{
    name?: string | null;
    phone: string;
    totalOrders: number;
    totalSpentCents: number;
  }>;
};

export default function RelatoriosPage() {
  const { token } = useAuth();
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setData(await apiGet<Dashboard>('/reports/dashboard', token));
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro');
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  function downloadCsv() {
    if (!token) return;
    void fetch(`${API_URL}/reports/orders.csv`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text());
        return res.blob();
      })
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'pedidos.csv';
        a.click();
        URL.revokeObjectURL(url);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'CSV falhou'));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Relatórios</h1>
          <p className="text-pc-muted">Últimos {data?.periodDays ?? 30} dias.</p>
        </div>
        <Button variant="ghost" onClick={downloadCsv}>
          Exportar CSV
        </Button>
      </div>
      {error ? <p className="text-sm text-pc-danger">{error}</p> : null}
      {data ? (
        <>
          <div className="grid gap-3 sm:grid-cols-4">
            {[
              ['Pedidos', String(data.totals.orders)],
              ['Aceitos', String(data.totals.accepted)],
              ['Receita', brl(data.totals.revenueCents)],
              ['Ticket médio', brl(data.totals.ticketMedioCents)],
            ].map(([label, value]) => (
              <div key={label} className="pc-card rounded-[1.25rem] p-4">
                <p className="text-xs uppercase tracking-wider text-pc-muted">
                  {label}
                </p>
                <p className="font-display mt-1 text-2xl font-bold">{value}</p>
              </div>
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <section className="pc-card rounded-[1.5rem] p-5">
              <h2 className="font-display text-lg font-bold">Por status</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {Object.entries(data.byStatus).map(([k, v]) => (
                  <li key={k} className="flex justify-between">
                    <span className="text-pc-muted">{k}</span>
                    <span className="font-semibold">{v}</span>
                  </li>
                ))}
              </ul>
            </section>
            <section className="pc-card rounded-[1.5rem] p-5">
              <h2 className="font-display text-lg font-bold">Top clientes</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {data.topCustomers.map((c) => (
                  <li key={c.phone} className="flex justify-between gap-2">
                    <span>{c.name || c.phone}</span>
                    <span className="text-pc-forest">
                      {brl(c.totalSpentCents)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
          <section className="pc-card rounded-[1.5rem] p-5">
            <h2 className="font-display text-lg font-bold">Série diária</h2>
            <div className="mt-3 max-h-64 overflow-auto text-sm">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-pc-muted">
                    <th className="py-1">Dia</th>
                    <th>Pedidos</th>
                    <th>Receita</th>
                  </tr>
                </thead>
                <tbody>
                  {data.series.map((s) => (
                    <tr key={s.date} className="border-t border-pc-stone/50">
                      <td className="py-1.5">{s.date}</td>
                      <td>{s.orders}</td>
                      <td>{brl(s.revenueCents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : (
        <p className="text-pc-muted">Carregando…</p>
      )}
    </div>
  );
}
