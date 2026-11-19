'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiGet, apiPost } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';

type Link = {
  id: string;
  code: string;
  commissionBps: number;
  status: string;
  clicks: number;
  conversions: number;
};

export default function AfiliadosPage() {
  const { token } = useAuth();
  const [links, setLinks] = useState<Link[]>([]);
  const [code, setCode] = useState('INFLUENCER');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setLinks(await apiGet<Link[]>('/affiliates', token));
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
      await apiPost('/affiliates', { code, commissionBps: 1000 }, token);
      setCode('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha');
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Afiliados</h1>
        <p className="text-pc-muted">Links de indicação com comissão em bps.</p>
      </div>
      {error ? <p className="text-sm text-pc-danger">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <input
          className="pc-input max-w-[12rem]"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Código"
        />
        <Button onClick={() => void create()}>Criar link</Button>
      </div>
      <ul className="space-y-2">
        {links.map((l) => (
          <li
            key={l.id}
            className="pc-card flex flex-wrap items-center justify-between gap-3 rounded-[1.25rem] p-4"
          >
            <div>
              <p className="font-semibold">{l.code}</p>
              <p className="text-xs text-pc-muted">
                {(l.commissionBps / 100).toFixed(1)}% · {l.clicks} cliques ·{' '}
                {l.conversions} conversões · {l.status}
              </p>
              <p className="mt-1 text-xs text-pc-leaf">
                /m/demo-burger?ref={l.code}
              </p>
            </div>
          </li>
        ))}
        {!links.length ? (
          <li className="text-sm text-pc-muted">Nenhum afiliado.</li>
        ) : null}
      </ul>
    </div>
  );
}
