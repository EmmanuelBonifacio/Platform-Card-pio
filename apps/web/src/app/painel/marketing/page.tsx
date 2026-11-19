'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiGet, apiPatch, apiPost } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';

type Coupon = {
  id: string;
  code: string;
  discountType: string;
  discountValue: number;
  isActive: boolean;
  redeemedCount: number;
  maxRedemptions?: number | null;
};

type Campaign = {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
};

export default function MarketingPage() {
  const { token } = useAuth();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [code, setCode] = useState('BEMVINDO10');
  const [discountValue, setDiscountValue] = useState(10);
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');
  const [campName, setCampName] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const [c, cam] = await Promise.all([
        apiGet<Coupon[]>('/marketing/coupons', token),
        apiGet<Campaign[]>('/marketing/campaigns', token),
      ]);
      setCoupons(c);
      setCampaigns(cam);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro');
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  async function createCoupon() {
    if (!token) return;
    try {
      await apiPost(
        '/marketing/coupons',
        { code, discountType, discountValue },
        token,
      );
      setCode('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha cupom');
    }
  }

  async function createCampaign() {
    if (!token || !campName.trim()) return;
    try {
      await apiPost(
        '/marketing/campaigns',
        { name: campName, type: 'WINBACK', payload: { channel: 'whatsapp' } },
        token,
      );
      setCampName('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha campanha');
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">Marketing</h1>
        <p className="text-pc-muted">Cupons e campanhas de reativação.</p>
      </div>
      {error ? <p className="text-sm text-pc-danger">{error}</p> : null}

      <section className="pc-card rounded-[1.5rem] p-5">
        <h2 className="font-display text-xl font-bold">Novo cupom</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <input
            className="pc-input max-w-[10rem]"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Código"
          />
          <select
            className="pc-input max-w-[8rem]"
            value={discountType}
            onChange={(e) => setDiscountType(e.target.value as 'percent' | 'fixed')}
          >
            <option value="percent">%</option>
            <option value="fixed">R$ (centavos)</option>
          </select>
          <input
            className="pc-input max-w-[7rem]"
            type="number"
            value={discountValue}
            onChange={(e) => setDiscountValue(Number(e.target.value))}
          />
          <Button onClick={() => void createCoupon()}>Criar</Button>
        </div>
        <ul className="mt-4 divide-y divide-pc-stone/60">
          {coupons.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-3 py-3">
              <div>
                <p className="font-semibold">{c.code}</p>
                <p className="text-xs text-pc-muted">
                  {c.discountType === 'percent'
                    ? `${c.discountValue}%`
                    : `R$ ${(c.discountValue / 100).toFixed(2)}`}{' '}
                  · {c.redeemedCount}
                  {c.maxRedemptions != null ? `/${c.maxRedemptions}` : ''} usos
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  void apiPatch(
                    `/marketing/coupons/${c.id}`,
                    { isActive: !c.isActive },
                    token!,
                  ).then(load)
                }
              >
                {c.isActive ? 'Pausar' : 'Ativar'}
              </Button>
            </li>
          ))}
          {!coupons.length ? (
            <li className="py-4 text-sm text-pc-muted">Nenhum cupom ainda.</li>
          ) : null}
        </ul>
      </section>

      <section className="pc-card rounded-[1.5rem] p-5">
        <h2 className="font-display text-xl font-bold">Campanhas</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <input
            className="pc-input max-w-xs"
            value={campName}
            onChange={(e) => setCampName(e.target.value)}
            placeholder="Nome da campanha winback"
          />
          <Button onClick={() => void createCampaign()}>Criar</Button>
        </div>
        <ul className="mt-4 space-y-2">
          {campaigns.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between rounded-2xl bg-pc-paper px-4 py-3"
            >
              <span>
                {c.name}{' '}
                <span className="text-xs text-pc-muted">({c.type})</span>
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  void apiPatch(
                    `/marketing/campaigns/${c.id}`,
                    { isActive: !c.isActive },
                    token!,
                  ).then(load)
                }
              >
                {c.isActive ? 'Pausar' : 'Ativar'}
              </Button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
