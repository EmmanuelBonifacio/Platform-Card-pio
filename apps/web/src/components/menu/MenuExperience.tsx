'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Minus, Plus, ShoppingBag, X } from 'lucide-react';
import { apiGet, apiPost } from '@/lib/api';
import { useCart } from '@/lib/cart';
import { brl } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { TrackingScripts } from '@/components/TrackingScripts';

type Menu = {
  tenant: {
    name: string;
    slug: string;
    logoUrl?: string | null;
    whatsappNumber?: string | null;
  };
  categories: Array<{
    id: string;
    name: string;
    products: Array<{
      id: string;
      name: string;
      description?: string | null;
      priceCents: number;
      promoPriceCents?: number | null;
      imageUrl?: string | null;
      isFeatured: boolean;
    }>;
  }>;
  combos: Array<{
    id: string;
    name: string;
    description?: string | null;
    priceCents: number;
    imageUrl?: string | null;
  }>;
};

export function MenuExperience({ menu }: { menu: Menu }) {
  const items = useCart((s) => s.items);
  const addItem = useCart((s) => s.addItem);
  const setQty = useCart((s) => s.setQty);
  const clear = useCart((s) => s.clear);
  const setSlug = useCart((s) => s.setSlug);
  const [hydrated, setHydrated] = useState(false);
  const [open, setOpen] = useState(false);
  const [checkout, setCheckout] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [type, setType] = useState<'DELIVERY' | 'PICKUP' | 'DINE_IN'>('PICKUP');
  const [notes, setNotes] = useState('');
  const [address, setAddress] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ number: number } | null>(null);
  const [error, setError] = useState('');
  const [coupon, setCoupon] = useState('');
  const [discountCents, setDiscountCents] = useState(0);
  const [couponMsg, setCouponMsg] = useState('');

  useEffect(() => {
    void useCart.persist.rehydrate().then(() => {
      setHydrated(true);
      setSlug(menu.tenant.slug);
    });
  }, [menu.tenant.slug, setSlug]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const ref = new URLSearchParams(window.location.search).get('ref');
    if (!ref) return;
    void apiPost(
      `/public/${menu.tenant.slug}/affiliates/${encodeURIComponent(ref)}/click`,
      {},
    ).catch(() => undefined);
  }, [menu.tenant.slug]);

  const featured = useMemo(
    () =>
      menu.categories.flatMap((c) =>
        c.products.filter((p) => p.isFeatured).map((p) => ({ ...p, cat: c.name })),
      ),
    [menu.categories],
  );

  const subtotal = items.reduce((acc, item) => {
    const addons = (item.addons ?? []).reduce((a, x) => a + x.priceCents, 0);
    return acc + (item.unitPriceCents + addons) * item.quantity;
  }, 0);
  const total = Math.max(0, subtotal - discountCents);
  const count = items.reduce((a, i) => a + i.quantity, 0);

  async function applyCoupon() {
    setCouponMsg('');
    if (!coupon.trim()) {
      setDiscountCents(0);
      return;
    }
    try {
      const res = await apiGet<{
        valid: boolean;
        discountCents?: number;
        message?: string;
      }>(
        `/public/${menu.tenant.slug}/coupons/validate?code=${encodeURIComponent(coupon)}&orderCents=${subtotal}`,
      );
      if (!res.valid) {
        setDiscountCents(0);
        setCouponMsg(res.message || 'Cupom inválido');
        return;
      }
      setDiscountCents(res.discountCents ?? 0);
      setCouponMsg(`Desconto ${brl(res.discountCents ?? 0)}`);
    } catch (e) {
      setDiscountCents(0);
      setCouponMsg(e instanceof Error ? e.message : 'Cupom inválido');
    }
  }

  async function placeOrder() {
    setBusy(true);
    setError('');
    try {
      if (phone.replace(/\D/g, '').length < 10) {
        throw new Error('Informe um WhatsApp válido');
      }
      if (!items.length) throw new Error('Carrinho vazio');
      const order = await apiPost<{ number: number }>(
        `/public/${menu.tenant.slug}/orders`,
        {
          type,
          customerPhone: phone.replace(/\D/g, ''),
          customerName: name || undefined,
          notes: notes || undefined,
          addressJson:
            type === 'DELIVERY' ? { line: address } : undefined,
          source: 'pwa',
          couponCode: coupon.trim() || undefined,
          items: items.map((i) => ({
            productId: i.productId,
            name: i.name,
            quantity: i.quantity,
            unitPriceCents: i.unitPriceCents,
            addons: i.addons,
          })),
        },
      );
      clear();
      setDiscountCents(0);
      setCoupon('');
      setDone({ number: order.number });
      setCheckout(false);
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha no pedido');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="pc-grain min-h-screen pb-28">
      <TrackingScripts slug={menu.tenant.slug} />
      <header className="relative overflow-hidden border-b border-pc-stone/70 bg-pc-ink text-pc-cream">
        <div className="absolute inset-0 opacity-40">
          <div className="absolute -left-20 top-0 h-56 w-56 rounded-full bg-pc-lime/30 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-pc-mint/30 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-3xl px-5 py-10 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-pc-lime">
            Platform Cardápio
          </p>
          <h1 className="font-display mt-3 text-4xl font-extrabold sm:text-5xl">
            {menu.tenant.name}
          </h1>
          <p className="mt-3 max-w-md text-sm text-pc-cream/75">
            Escolha, monte o pedido e envie em um toque. Sem app para baixar.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-3xl space-y-10 px-5 py-8 sm:px-6">
        {featured.length > 0 ? (
          <section>
            <h2 className="font-display text-2xl font-bold text-pc-ink">
              Destaques
            </h2>
            <div className="mt-4 flex gap-4 overflow-x-auto pb-2">
              {featured.map((p) => {
                const price = p.promoPriceCents ?? p.priceCents;
                return (
                  <motion.button
                    key={p.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      addItem({
                        key: p.id,
                        productId: p.id,
                        name: p.name,
                        unitPriceCents: price,
                      });
                      setOpen(true);
                    }}
                    className="pc-card w-56 shrink-0 rounded-[1.5rem] p-4 text-left"
                  >
                    <div className="flex h-28 items-end rounded-2xl bg-gradient-to-br from-pc-leaf to-pc-ink p-3 text-xs font-semibold text-pc-lime">
                      {p.cat}
                    </div>
                    <p className="mt-3 font-semibold text-pc-ink">{p.name}</p>
                    <p className="mt-1 text-sm text-pc-leaf">{brl(price)}</p>
                  </motion.button>
                );
              })}
            </div>
          </section>
        ) : null}

        {menu.categories.map((cat) => (
          <section key={cat.id} id={cat.id}>
            <h2 className="font-display text-2xl font-bold text-pc-ink">
              {cat.name}
            </h2>
            <ul className="mt-4 space-y-3">
              {cat.products.map((p) => {
                const price = p.promoPriceCents ?? p.priceCents;
                return (
                  <li key={p.id} className="pc-card overflow-hidden rounded-[1.4rem]">
                    <div className="flex gap-4 p-4">
                      <div className="h-20 w-20 shrink-0 rounded-2xl bg-gradient-to-br from-pc-stone to-pc-paper" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-semibold text-pc-ink">{p.name}</h3>
                            {p.description ? (
                              <p className="mt-1 line-clamp-2 text-sm text-pc-muted">
                                {p.description}
                              </p>
                            ) : null}
                          </div>
                          <p className="shrink-0 font-semibold text-pc-forest">
                            {brl(price)}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="lime"
                          className="mt-3"
                          onClick={() => {
                            addItem({
                              key: p.id,
                              productId: p.id,
                              name: p.name,
                              unitPriceCents: price,
                            });
                            setOpen(true);
                          }}
                        >
                          Adicionar
                        </Button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}

        {menu.combos?.length ? (
          <section>
            <h2 className="font-display text-2xl font-bold text-pc-ink">Combos</h2>
            <ul className="mt-4 space-y-3">
              {menu.combos.map((c) => (
                <li key={c.id} className="pc-card rounded-[1.4rem] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">{c.name}</h3>
                      {c.description ? (
                        <p className="text-sm text-pc-muted">{c.description}</p>
                      ) : null}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-pc-forest">
                        {brl(c.priceCents)}
                      </p>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="mt-2"
                        onClick={() => {
                          addItem({
                            key: `combo-${c.id}`,
                            name: c.name,
                            unitPriceCents: c.priceCents,
                          });
                          setOpen(true);
                        }}
                      >
                        Adicionar
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>

      {/* evita mismatch SSR/hydration do carrinho persistido */}
      {!hydrated ? null : null}

      <AnimatePresence>
        {hydrated && count > 0 ? (
          <motion.button
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-5 left-1/2 z-40 flex w-[min(92vw,28rem)] -translate-x-1/2 items-center justify-between rounded-full bg-pc-ink px-5 py-3.5 text-pc-cream shadow-2xl"
          >
            <span className="inline-flex items-center gap-2 text-sm font-semibold">
              <ShoppingBag className="h-4 w-4 text-pc-lime" />
              {count} {count === 1 ? 'item' : 'itens'}
            </span>
            <span className="font-display text-lg font-bold text-pc-lime">
              {brl(total)}
            </span>
          </motion.button>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {open ? (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center bg-pc-ink/45 p-3 sm:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 30, opacity: 0 }}
              className="pc-card max-h-[88vh] w-full max-w-md overflow-auto rounded-[1.75rem] p-5"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-display text-xl font-bold">
                  {checkout ? 'Finalizar' : 'Seu pedido'}
                </h3>
                <button onClick={() => { setOpen(false); setCheckout(false); }}>
                  <X className="h-5 w-5" />
                </button>
              </div>

              {!checkout ? (
                <div className="mt-4 space-y-3">
                  {items.map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between gap-3 rounded-2xl bg-pc-paper px-3 py-3"
                    >
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-pc-muted">
                          {brl(item.unitPriceCents)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          className="rounded-full bg-white p-1 ring-1 ring-pc-stone"
                          onClick={() => setQty(item.key, item.quantity - 1)}
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-5 text-center text-sm font-semibold">
                          {item.quantity}
                        </span>
                        <button
                          className="rounded-full bg-white p-1 ring-1 ring-pc-stone"
                          onClick={() => setQty(item.key, item.quantity + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-2 text-lg font-semibold">
                    <span>Total</span>
                    <span className="text-pc-forest">{brl(total)}</span>
                  </div>
                  <Button
                    className="w-full"
                    size="lg"
                    variant="primary"
                    onClick={() => setCheckout(true)}
                    disabled={!items.length}
                  >
                    Continuar
                  </Button>
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  <input
                    className="pc-input"
                    placeholder="Seu nome"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  <input
                    className="pc-input"
                    placeholder="WhatsApp (com DDD)"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                  <div className="flex gap-2">
                    {(['PICKUP', 'DELIVERY', 'DINE_IN'] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setType(t)}
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                          type === t
                            ? 'bg-pc-ink text-pc-lime'
                            : 'bg-pc-paper text-pc-muted'
                        }`}
                      >
                        {t === 'PICKUP'
                          ? 'Retirada'
                          : t === 'DELIVERY'
                            ? 'Delivery'
                            : 'Local'}
                      </button>
                    ))}
                  </div>
                  {type === 'DELIVERY' ? (
                    <input
                      className="pc-input"
                      placeholder="Endereço completo"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                  ) : null}
                  <textarea
                    className="pc-input min-h-20"
                    placeholder="Observações"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <input
                      className="pc-input"
                      placeholder="Cupom"
                      value={coupon}
                      onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => void applyCoupon()}
                    >
                      Aplicar
                    </Button>
                  </div>
                  {couponMsg ? (
                    <p className="text-xs text-pc-leaf">{couponMsg}</p>
                  ) : null}
                  {discountCents > 0 ? (
                    <p className="text-sm text-pc-muted">
                      Subtotal {brl(subtotal)} − desconto {brl(discountCents)}
                    </p>
                  ) : null}
                  {error ? (
                    <p className="text-sm text-pc-danger">{error}</p>
                  ) : null}
                  <Button
                    className="w-full"
                    size="lg"
                    variant="lime"
                    disabled={busy}
                    onClick={() => void placeOrder()}
                  >
                    {busy ? 'Enviando…' : `Pedir · ${brl(total)}`}
                  </Button>
                </div>
              )}
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {done ? (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-pc-ink/50 p-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="pc-card max-w-sm rounded-[2rem] p-8 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-pc-leaf">
                Pedido enviado
              </p>
              <h3 className="font-display mt-3 text-3xl font-extrabold">
                #{done.number}
              </h3>
              <p className="mt-3 text-sm text-pc-muted">
                A loja vai analisar e aceitar em breve. Você pode acompanhar pelo
                WhatsApp se estiver configurado.
              </p>
              <Button
                className="mt-6 w-full"
                onClick={() => setDone(null)}
              >
                Continuar no cardápio
              </Button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </main>
  );
}
