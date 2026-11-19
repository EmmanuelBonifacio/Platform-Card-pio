'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { AlertsBanner } from '@/components/AlertsBanner';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';

const links = [
  { href: '/painel/pedidos', label: 'Pedidos' },
  { href: '/painel/cardapio', label: 'Cardápio' },
  { href: '/gestor', label: 'Gestor' },
];

export default function PainelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { token, user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === '/painel';

  useEffect(() => {
    if (!loading && !token && !isLogin) {
      router.replace('/painel');
    }
    if (!loading && token && isLogin) {
      router.replace('/painel/pedidos');
    }
  }, [loading, token, isLogin, router]);

  if (isLogin) {
    return <div className="pc-grain min-h-screen">{children}</div>;
  }

  if (loading || !token) {
    return (
      <div className="pc-grain flex min-h-screen items-center justify-center text-pc-muted">
        Carregando painel…
      </div>
    );
  }

  return (
    <div className="pc-grain min-h-screen">
      <header className="border-b border-pc-stone/80 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <div>
            <Link href="/painel/pedidos" className="font-display text-lg font-bold text-pc-ink">
              Platform <span className="text-pc-leaf">Cardápio</span>
            </Link>
            <p className="text-xs text-pc-muted">{user?.name || user?.email}</p>
          </div>
          <nav className="flex flex-wrap items-center gap-1 sm:gap-2">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  'rounded-full px-3 py-1.5 text-sm font-medium',
                  pathname.startsWith(l.href)
                    ? 'bg-pc-ink text-pc-lime'
                    : 'text-pc-muted hover:bg-pc-stone/60',
                )}
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/m/demo-burger"
              className="hidden rounded-full px-3 py-1.5 text-sm text-pc-muted sm:inline"
            >
              Público
            </Link>
            <Button size="sm" variant="ghost" onClick={logout}>
              Sair
            </Button>
          </nav>
        </div>
      </header>
      <div className="mx-auto max-w-6xl space-y-4 px-4 py-6">
        <AlertsBanner />
        {children}
      </div>
    </div>
  );
}
