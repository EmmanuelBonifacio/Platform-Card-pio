'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, UtensilsCrossed, Workflow } from 'lucide-react';
import { Button } from '@/components/ui/button';

const features = [
  {
    icon: UtensilsCrossed,
    title: 'Cardápio que vende',
    text: 'Fotos, categorias e checkout em segundos no celular do cliente.',
  },
  {
    icon: Workflow,
    title: 'Pedidos sob controle',
    text: 'Kanban do aceite à entrega, com crédito debitado só quando você aceita.',
  },
  {
    icon: Sparkles,
    title: 'Gestor inteligente',
    text: 'Planos, saldo e alertas para nunca perder venda por falta de créditos.',
  },
];

export default function HomePage() {
  return (
    <main className="pc-grain relative min-h-screen overflow-hidden">
      <div className="pc-grid absolute inset-0 opacity-60" />
      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-5 pb-16 pt-8 sm:px-8">
        <header className="flex items-center justify-between gap-4">
          <div className="font-display text-xl font-bold text-pc-ink sm:text-2xl">
            Platform <span className="text-pc-leaf">Cardápio</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/painel" className="hidden text-sm font-medium text-pc-muted sm:inline">
              Entrar
            </Link>
            <Link href="/m/demo-burger">
              <Button variant="lime" size="sm">
                Ver demo
              </Button>
            </Link>
          </div>
        </header>

        <section className="mt-16 grid flex-1 items-center gap-12 lg:mt-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 rounded-full border border-pc-stone bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-pc-leaf"
            >
              FoodFlow AI · SaaS para o seu negócio
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="font-display mt-6 max-w-xl text-5xl font-extrabold leading-[0.95] text-pc-ink sm:text-6xl lg:text-7xl"
            >
              Seu cardápio
              <span className="block text-pc-leaf">mais desejável.</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16 }}
              className="mt-6 max-w-lg text-lg leading-relaxed text-pc-muted"
            >
              Transforme visitas em pedidos com uma experiência premium no
              celular — e um painel profissional para aceitar, preparar e
              crescer sem fricção.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.24 }}
              className="mt-8 flex flex-wrap gap-3"
            >
              <Link href="/m/demo-burger">
                <Button variant="primary" size="lg">
                  Abrir cardápio demo
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/painel">
                <Button variant="ghost" size="lg">
                  Painel do lojista
                </Button>
              </Link>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.18, duration: 0.5 }}
            className="pc-float relative"
          >
            <div className="pc-card relative overflow-hidden rounded-[2rem] p-6 sm:p-8">
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-pc-lime/40 blur-2xl" />
              <div className="absolute -bottom-8 -left-8 h-36 w-36 rounded-full bg-pc-mint/20 blur-2xl" />
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-pc-leaf">
                Pedido #128
              </p>
              <h2 className="font-display mt-3 text-3xl font-bold text-pc-ink">
                Classic Burger
              </h2>
              <p className="mt-2 text-pc-muted">2 itens · Retirada · R$ 57,80</p>
              <div className="mt-6 space-y-3">
                <div className="rounded-2xl bg-pc-ink px-4 py-3 text-sm text-pc-lime">
                  Aceito · crédito debitado
                </div>
                <div className="rounded-2xl bg-pc-paper px-4 py-3 text-sm text-pc-muted">
                  Preparando na cozinha…
                </div>
              </div>
              <div className="mt-8 flex items-end justify-between">
                <div>
                  <p className="text-xs text-pc-muted">Saldo do ciclo</p>
                  <p className="font-display text-2xl font-bold text-pc-forest">
                    399 / 400
                  </p>
                </div>
                <div className="rounded-full bg-pc-lime px-4 py-2 text-xs font-bold text-pc-ink">
                  LIVE
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        <section className="mt-20 grid gap-4 md:grid-cols-3">
          {features.map((f, i) => (
            <motion.article
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="pc-card rounded-[1.5rem] p-6"
            >
              <f.icon className="h-6 w-6 text-pc-leaf" />
              <h3 className="font-display mt-4 text-xl font-bold text-pc-ink">
                {f.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-pc-muted">
                {f.text}
              </p>
            </motion.article>
          ))}
        </section>
      </div>
    </main>
  );
}
