'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiGet } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';

type Insights = {
  engine: string;
  windowDays: number;
  topItems: Array<{ name: string; qty: number }>;
  tips: string[];
  crossSell: Array<{ anchor: string; suggest: string }>;
};

export default function IaPage() {
  const { token } = useAuth();
  const [data, setData] = useState<Insights | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setData(await apiGet<Insights>('/ai/insights', token));
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro');
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Insights IA</h1>
          <p className="text-pc-muted">
            Heurísticas locais agora — LLM pluggable depois.
          </p>
        </div>
        <Button variant="ghost" onClick={() => void load()}>
          Atualizar
        </Button>
      </div>
      {error ? <p className="text-sm text-pc-danger">{error}</p> : null}
      {data ? (
        <>
          <p className="text-xs text-pc-muted">
            Engine {data.engine} · janela {data.windowDays} dias
          </p>
          <section className="pc-card rounded-[1.5rem] p-5">
            <h2 className="font-display text-lg font-bold">Sugestões</h2>
            <ul className="mt-3 space-y-2">
              {data.tips.map((t) => (
                <li
                  key={t}
                  className="rounded-2xl bg-pc-paper px-4 py-3 text-sm"
                >
                  {t}
                </li>
              ))}
              {!data.tips.length ? (
                <li className="text-sm text-pc-muted">Sem tips no período.</li>
              ) : null}
            </ul>
          </section>
          <div className="grid gap-4 lg:grid-cols-2">
            <section className="pc-card rounded-[1.5rem] p-5">
              <h2 className="font-display text-lg font-bold">Mais pedidos</h2>
              <ul className="mt-3 space-y-1 text-sm">
                {data.topItems.map((i) => (
                  <li key={i.name} className="flex justify-between">
                    <span>{i.name}</span>
                    <span className="font-semibold">{i.qty}</span>
                  </li>
                ))}
              </ul>
            </section>
            <section className="pc-card rounded-[1.5rem] p-5">
              <h2 className="font-display text-lg font-bold">Cross-sell</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {data.crossSell.map((c) => (
                  <li key={c.anchor}>
                    <span className="font-medium">{c.anchor}</span>
                    <span className="text-pc-muted"> → {c.suggest}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </>
      ) : (
        <p className="text-pc-muted">Carregando…</p>
      )}
    </div>
  );
}
