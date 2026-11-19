'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiGet, apiPost } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';

type Sub = {
  id: string;
  endpoint: string;
  userAgent?: string | null;
  createdAt: string;
};

export default function PushPage() {
  const { token } = useAuth();
  const [subs, setSubs] = useState<Sub[]>([]);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setSubs(await apiGet<Sub[]>('/push/subscriptions', token));
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro');
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  async function registerStub() {
    if (!token) return;
    try {
      const endpoint = `https://push.local/stub/${crypto.randomUUID()}`;
      await apiPost(
        '/push/subscribe',
        {
          endpoint,
          keys: { p256dh: 'stub-p256dh', auth: 'stub-auth' },
          userAgent: navigator.userAgent,
        },
        token,
      );
      setMsg('Dispositivo registrado (stub sem VAPID).');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha');
    }
  }

  async function testPush() {
    if (!token) return;
    try {
      const res = await apiPost<{ queued: number }>('/push/test', {}, token);
      setMsg(`Fila stub: ${res.queued} dispositivo(s).`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha');
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Push</h1>
        <p className="text-pc-muted">
          Inscrição web-push (stub). VAPID/produção depois; Asaas continua por
          último.
        </p>
      </div>
      {error ? <p className="text-sm text-pc-danger">{error}</p> : null}
      {msg ? <p className="text-sm text-pc-leaf">{msg}</p> : null}
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => void registerStub()}>Registrar device stub</Button>
        <Button variant="ghost" onClick={() => void testPush()}>
          Disparar teste
        </Button>
      </div>
      <ul className="space-y-2 text-sm">
        {subs.map((s) => (
          <li key={s.id} className="pc-card rounded-[1.25rem] p-4">
            <p className="truncate font-mono text-xs">{s.endpoint}</p>
            <p className="mt-1 text-pc-muted">
              {new Date(s.createdAt).toLocaleString('pt-BR')}
            </p>
          </li>
        ))}
        {!subs.length ? (
          <li className="text-pc-muted">Nenhuma inscrição ainda.</li>
        ) : null}
      </ul>
    </div>
  );
}
