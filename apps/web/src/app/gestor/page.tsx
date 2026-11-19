'use client';

import { useState } from 'react';
import { API_URL, apiGet, apiPost } from '@/lib/api';

type Plan = {
  code: string;
  name: string;
  priceCents: number;
  orderLimit: number | null;
};

export default function GestorPage() {
  const [email, setEmail] = useState('loja@demo.com');
  const [password, setPassword] = useState('loja123_TROQUE');
  const [token, setToken] = useState('');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<unknown>(null);
  const [message, setMessage] = useState('');

  async function login() {
    setMessage('');
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      setMessage(await res.text());
      return;
    }
    const data = (await res.json()) as { accessToken: string };
    setToken(data.accessToken);
    const [p, s] = await Promise.all([
      apiGet<Plan[]>('/gestor/plans', data.accessToken),
      apiGet('/gestor/subscription', data.accessToken),
    ]);
    setPlans(p);
    setSubscription(s);
  }

  async function checkout(planCode: string) {
    const result = await apiPost(
      '/gestor/checkout',
      { planCode, method: 'PIX', provider: 'manual' },
      token,
    );
    setMessage(JSON.stringify(result));
    setSubscription(await apiGet('/gestor/subscription', token));
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-semibold text-neutral-900">Gestor</h1>
      <p className="mt-1 text-neutral-600">
        Planos, saldo e recarga — Asaas na fase final.
      </p>

      {!token ? (
        <div className="mt-8 space-y-3 rounded-2xl bg-neutral-50 p-6">
          <input
            className="w-full rounded-xl border px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email"
          />
          <input
            className="w-full rounded-xl border px-3 py-2"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="senha"
          />
          <button
            onClick={() => void login()}
            className="rounded-full bg-emerald-600 px-5 py-2 text-white"
          >
            Entrar
          </button>
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          <pre className="overflow-auto rounded-2xl bg-neutral-900 p-4 text-xs text-emerald-100">
            {JSON.stringify(subscription, null, 2)}
          </pre>
          <div className="grid gap-4 sm:grid-cols-3">
            {plans.map((p) => (
              <div
                key={p.code}
                className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm"
              >
                <h2 className="text-lg font-semibold">{p.name}</h2>
                <p className="text-emerald-700">
                  {(p.priceCents / 100).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </p>
                <p className="text-sm text-neutral-500">
                  {p.orderLimit == null
                    ? 'Ilimitado'
                    : `Até ${p.orderLimit} pedidos`}
                </p>
                <button
                  className="mt-3 w-full rounded-full bg-emerald-600 py-2 text-sm text-white"
                  onClick={() => void checkout(p.code)}
                >
                  Quero esse
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {message ? (
        <p className="mt-6 whitespace-pre-wrap text-sm text-neutral-700">
          {message}
        </p>
      ) : null}
    </main>
  );
}
