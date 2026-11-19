'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiGet, apiPatch, apiPost } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';

type Config = {
  phone: string | null;
  botEnabled: boolean;
  welcomeMessage: string;
  autoReplyEnabled: boolean;
};

export default function WhatsappPage() {
  const { token } = useAuth();
  const [cfg, setCfg] = useState<Config | null>(null);
  const [phone, setPhone] = useState('');
  const [welcome, setWelcome] = useState('');
  const [botEnabled, setBotEnabled] = useState(false);
  const [testFrom, setTestFrom] = useState('5534999999999');
  const [reply, setReply] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const c = await apiGet<Config>('/whatsapp/config', token);
      setCfg(c);
      setPhone(c.phone ?? '');
      setWelcome(c.welcomeMessage);
      setBotEnabled(c.botEnabled);
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
        '/whatsapp/config',
        {
          phone,
          botEnabled,
          welcomeMessage: welcome,
          autoReplyEnabled: true,
        },
        token,
      );
      setOk('Configuração salva');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao salvar');
    }
  }

  async function testWebhook() {
    try {
      const res = await apiPost<{ reply?: string | null }>('/whatsapp/webhook', {
        tenantSlug: 'demo-burger',
        from: testFrom,
        text: 'oi',
      });
      setReply(res.reply ?? '(sem auto-reply — ative o bot)');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Webhook falhou');
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">WhatsApp</h1>
        <p className="text-pc-muted">
          Canal + bot stub (Meta Cloud / Evolution depois). Sem Asaas.
        </p>
      </div>
      {error ? <p className="text-sm text-pc-danger">{error}</p> : null}
      {ok ? <p className="text-sm text-pc-leaf">{ok}</p> : null}
      <section className="pc-card space-y-3 rounded-[1.5rem] p-5">
        <label className="block text-sm">
          Número da loja
          <input
            className="pc-input mt-1"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="5534…"
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={botEnabled}
            onChange={(e) => setBotEnabled(e.target.checked)}
          />
          Bot ativo
        </label>
        <label className="block text-sm">
          Mensagem de boas-vindas
          <textarea
            className="pc-input mt-1 min-h-24"
            value={welcome}
            onChange={(e) => setWelcome(e.target.value)}
          />
        </label>
        <Button onClick={() => void save()}>Salvar</Button>
        {cfg ? (
          <p className="text-xs text-pc-muted">
            Auto-reply: {cfg.autoReplyEnabled ? 'sim' : 'não'}
          </p>
        ) : null}
      </section>
      <section className="pc-card space-y-3 rounded-[1.5rem] p-5">
        <h2 className="font-display text-lg font-bold">Testar webhook stub</h2>
        <input
          className="pc-input max-w-xs"
          value={testFrom}
          onChange={(e) => setTestFrom(e.target.value)}
        />
        <Button variant="ghost" onClick={() => void testWebhook()}>
          Simular inbound
        </Button>
        {reply ? (
          <p className="rounded-2xl bg-pc-paper p-3 text-sm">{reply}</p>
        ) : null}
      </section>
    </div>
  );
}
