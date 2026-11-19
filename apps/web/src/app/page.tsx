import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#0b1f14] text-white">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-16">
        <p className="text-sm uppercase tracking-[0.2em] text-emerald-300/80">
          FoodFlow AI
        </p>
        <h1 className="mt-3 text-5xl font-semibold tracking-tight sm:text-6xl">
          Platform Cardápio
        </h1>
        <p className="mt-5 max-w-xl text-lg text-emerald-50/80">
          Cardápio digital, pedidos, CRM e billing pré-pago para os clientes do
          seu SaaS Platform — créditos debitados só quando o lojista aceita.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            href="/m/demo-burger"
            className="rounded-full bg-emerald-400 px-6 py-3 font-medium text-emerald-950"
          >
            Ver cardápio demo
          </Link>
          <Link
            href="/gestor"
            className="rounded-full border border-emerald-400/40 px-6 py-3 font-medium text-emerald-100"
          >
            Abrir Gestor
          </Link>
        </div>
      </div>
    </main>
  );
}
