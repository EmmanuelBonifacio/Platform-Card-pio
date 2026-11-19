import Link from 'next/link';
import { AlertsBanner } from '@/components/AlertsBanner';

export default function PainelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f4f7f5]">
      <header className="border-b border-emerald-900/10 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <Link href="/painel" className="font-semibold text-emerald-900">
            Platform Cardápio
          </Link>
          <nav className="flex flex-wrap gap-3 text-sm text-neutral-700">
            <Link href="/painel/pedidos">Pedidos</Link>
            <Link href="/painel/cardapio">Cardápio</Link>
            <Link href="/gestor">Gestor</Link>
            <Link href="/m/demo-burger">Ver público</Link>
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
