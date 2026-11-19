'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/lib/api';
import { setToken } from '@/lib/auth';

export default function PainelLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('loja@demo.com');
  const [password, setPassword] = useState('loja123_TROQUE');
  const [error, setError] = useState('');

  async function login() {
    setError('');
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      setError(await res.text());
      return;
    }
    const data = (await res.json()) as { accessToken: string };
    setToken(data.accessToken);
    router.push('/painel/pedidos');
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
      <h1 className="text-2xl font-semibold">Entrar no painel</h1>
      <p className="mt-1 text-sm text-neutral-600">Use o seed demo-burger.</p>
      <div className="mt-6 space-y-3">
        <input
          className="w-full rounded-xl border px-3 py-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="w-full rounded-xl border px-3 py-2"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          onClick={() => void login()}
          className="w-full rounded-full bg-emerald-600 py-2.5 text-white"
        >
          Entrar
        </button>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </div>
    </div>
  );
}
