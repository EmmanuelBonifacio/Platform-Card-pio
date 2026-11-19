'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiGet, apiPatch } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';

type Settings = {
  name: string;
  slug: string;
  subdomain?: string | null;
  metaPixelId?: string | null;
  gaMeasurementId?: string | null;
  gtmContainerId?: string | null;
};

export default function ConfigPage() {
  const { token } = useAuth();
  const [s, setS] = useState<Settings | null>(null);
  const [metaPixelId, setMeta] = useState('');
  const [gaMeasurementId, setGa] = useState('');
  const [gtmContainerId, setGtm] = useState('');
  const [subdomain, setSub] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const data = await apiGet<Settings>('/tenant/settings', token);
      setS(data);
      setMeta(data.metaPixelId ?? '');
      setGa(data.gaMeasurementId ?? '');
      setGtm(data.gtmContainerId ?? '');
      setSub(data.subdomain ?? '');
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro');
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  async function save() {
    if (!token) return;
    try {
      await apiPatch(
        '/tenant/tracking',
        {
          metaPixelId: metaPixelId || null,
          gaMeasurementId: gaMeasurementId || null,
          gtmContainerId: gtmContainerId || null,
          subdomain: subdomain || null,
        },
        token,
      );
      setMsg('Tracking salvo. Subdomínio aguarda DNS Cloudflare.');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha');
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Configurações</h1>
        <p className="text-pc-muted">
          Pixel / GA / GTM e stub de subdomínio.
        </p>
      </div>
      {error ? <p className="text-sm text-pc-danger">{error}</p> : null}
      {msg ? <p className="text-sm text-pc-leaf">{msg}</p> : null}
      {s ? (
        <p className="text-sm text-pc-muted">
          Loja <strong>{s.name}</strong> · slug <code>{s.slug}</code>
        </p>
      ) : null}
      <section className="pc-card space-y-3 rounded-[1.5rem] p-5">
        <label className="block text-sm">
          Meta Pixel ID
          <input
            className="pc-input mt-1"
            value={metaPixelId}
            onChange={(e) => setMeta(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          GA Measurement ID
          <input
            className="pc-input mt-1"
            value={gaMeasurementId}
            onChange={(e) => setGa(e.target.value)}
            placeholder="G-XXXX"
          />
        </label>
        <label className="block text-sm">
          GTM Container
          <input
            className="pc-input mt-1"
            value={gtmContainerId}
            onChange={(e) => setGtm(e.target.value)}
            placeholder="GTM-XXXX"
          />
        </label>
        <label className="block text-sm">
          Subdomínio desejado
          <input
            className="pc-input mt-1"
            value={subdomain}
            onChange={(e) => setSub(e.target.value)}
            placeholder="minhaloja"
          />
        </label>
        <p className="text-xs text-pc-muted">
          Provisionamento DNS Cloudflare fica para fase de infra — o valor já é
          persistido.
        </p>
        <Button onClick={() => void save()}>Salvar</Button>
      </section>
    </div>
  );
}
