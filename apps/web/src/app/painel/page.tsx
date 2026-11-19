'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';

export default function PainelLoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('loja@demo.com');
  const [password, setPassword] = useState('loja123_TROQUE');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(email, password);
      router.push('/painel/pedidos');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha no login');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md items-center px-5">
      <motion.form
        onSubmit={onSubmit}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="pc-card w-full rounded-[2rem] p-7"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-pc-leaf">
          Painel do lojista
        </p>
        <h1 className="font-display mt-3 text-3xl font-extrabold text-pc-ink">
          Bem-vindo de volta
        </h1>
        <p className="mt-2 text-sm text-pc-muted">
          Acesse pedidos, cardápio e créditos do seu estabelecimento.
        </p>
        <div className="mt-6 space-y-3">
          <input
            className="pc-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-mail"
            type="email"
            required
          />
          <input
            className="pc-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Senha"
            type="password"
            required
          />
          <Button className="w-full" size="lg" disabled={busy} type="submit">
            {busy ? 'Entrando…' : 'Entrar no painel'}
          </Button>
          {error ? <p className="text-sm text-pc-danger">{error}</p> : null}
        </div>
        <p className="mt-5 text-xs text-pc-muted">
          Demo: loja@demo.com / loja123_TROQUE
        </p>
      </motion.form>
    </div>
  );
}
