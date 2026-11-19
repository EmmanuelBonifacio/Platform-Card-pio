'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { apiGet, apiPost } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { brl } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { AlertsBanner } from '@/components/AlertsBanner';

type Plan = {
  code: string;
  name: string;
  priceCents: number;
  orderLimit: number | null;
  description?: string | null;
};

type SubResponse = {
  subscription: {
    plan?: { name: string; code: string };
    currentCycle?: {
      consumed: number;
      orderLimit: number | null;
      endsAt: string;
      status: string;
    };
  } | null;
  balance: {
    consumed: number;
    remaining: number | null;
    limit: number | null;
    endsAt: string | null;
    daysLeft?: number;
    alerts?: Array<{ code: string; message: string; level: string }>;
  };
};

export default function GestorPage() {
  const { token, loading, login } = useAuth();
  const [email, setEmail] = useState('loja@demo.com');
  const [password, setPassword] = useState('loja123_TROQUE');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [sub, setSub] = useState<SubResponse | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function load(tok: string) {
    const [p, s] = await Promise.all([
      apiGet<Plan[]>('/gestor/plans', tok),
      apiGet<SubResponse>('/gestor/subscription', tok),
    ]);
    setPlans(p);
    setSub(s);
  }

  useEffect(() => {
    if (!token) return;
    void load(token).catch((e) =>
      setError(e instanceof Error ? e.message : 'Erro'),
    );
  }, [token]);

  async function doLogin() {
    setError('');
    try {
      await login(email, password);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Login falhou');
    }
  }

  async function checkout(planCode: string) {
    if (!token) return;
    const result = await apiPost(
      '/gestor/checkout',
      { planCode, method: 'PIX', provider: 'manual' },
      token,
    );
    setMessage(JSON.stringify(result));
    await load(token);
  }

  if (loading) {
    return (
      <main className="pc-grain flex min-h-screen items-center justify-center">
        Carregando…
      </main>
    );
  }

  if (!token) {
    return (
      <main className="pc-grain flex min-h-screen items-center justify-center px-5">
        <div className="pc-card w-full max-w-md rounded-[2rem] p-7">
          <h1 className="font-display text-3xl font-extrabold">Gestor</h1>
          <p className="mt-2 text-sm text-pc-muted">
            Entre para ver planos, saldo e recargas.
          </p>
          <div className="mt-6 space-y-3">
            <input
              className="pc-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              className="pc-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button className="w-full" onClick={() => void doLogin()}>
              Entrar
            </Button>
            {error ? <p className="text-sm text-pc-danger">{error}</p> : null}
          </div>
        </div>
      </main>
    );
  }

  const bal = sub?.balance;
  const pct =
    bal?.limit && bal.limit > 0
      ? Math.min(100, Math.round((bal.consumed / bal.limit) * 100))
      : bal?.limit == null
        ? 12
        : 100;

  return (
    <main className="pc-grain min-h-screen">
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-pc-leaf">
              Módulo Gestor
            </p>
            <h1 className="font-display text-4xl font-extrabold text-pc-ink">
              Planos & créditos
            </h1>
          </div>
          <Link href="/painel/pedidos">
            <Button variant="ghost">Voltar ao painel</Button>
          </Link>
        </div>

        <AlertsBanner />

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="pc-card overflow-hidden rounded-[2rem] p-6"
        >
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm text-pc-muted">Plano atual</p>
              <h2 className="font-display text-3xl font-bold text-pc-ink">
                {sub?.subscription?.plan?.name ?? '—'}
              </h2>
            </div>
            <div className="text-right">
              <p className="text-sm text-pc-muted">Consumidos</p>
              <p className="font-display text-2xl font-bold text-pc-forest">
                {bal?.consumed ?? 0}
                {bal?.limit != null ? ` / ${bal.limit}` : ' · ilimitado'}
              </p>
            </div>
          </div>
          <div className="mt-5 h-3 overflow-hidden rounded-full bg-pc-stone">
            <div
              className="h-full rounded-full bg-gradient-to-r from-pc-leaf to-pc-lime"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-3 text-sm text-pc-muted">
            {bal?.daysLeft != null
              ? `${bal.daysLeft} dia(s) restantes no ciclo`
              : 'Ciclo ativo'}
            {bal?.endsAt
              ? ` · expira ${new Date(bal.endsAt).toLocaleDateString('pt-BR')}`
              : ''}
          </p>
        </motion.section>

        <section className="grid gap-4 md:grid-cols-3">
          {plans.map((p, i) => (
            <motion.article
              key={p.code}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="pc-card flex flex-col rounded-[1.75rem] p-5"
            >
              <h3 className="font-display text-2xl font-bold">{p.name}</h3>
              <p className="mt-2 font-display text-3xl font-extrabold text-pc-leaf">
                {brl(p.priceCents)}
              </p>
              <p className="mt-1 text-sm text-pc-muted">
                {p.orderLimit == null
                  ? 'Pedidos ilimitados / 30 dias'
                  : `Até ${p.orderLimit} pedidos / 30 dias`}
              </p>
              <ul className="mt-4 flex-1 space-y-1 text-sm text-pc-muted">
                <li>✓ Cardápio digital</li>
                <li>✓ Gestão de pedidos</li>
                <li>✓ Alertas de saldo</li>
                <li>✓ Subdomínio (em breve)</li>
              </ul>
              <Button
                className="mt-5 w-full"
                variant={p.code === 'premium' ? 'lime' : 'primary'}
                onClick={() => void checkout(p.code)}
              >
                Quero esse
              </Button>
            </motion.article>
          ))}
        </section>

        {message ? (
          <pre className="overflow-auto rounded-2xl bg-pc-ink p-4 text-xs text-pc-lime">
            {message}
          </pre>
        ) : null}
        {error ? <p className="text-sm text-pc-danger">{error}</p> : null}
        <p className="text-xs text-pc-muted">
          Pagamento Asaas entra na fase final. Hoje a recarga usa provider
          manual (homologação).
        </p>
      </div>
    </main>
  );
}
