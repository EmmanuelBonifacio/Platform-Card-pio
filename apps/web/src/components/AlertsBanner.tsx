'use client';

import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api';
import { useAuth } from '@/lib/auth';

type Alert = { level: string; code: string; message: string };

export function AlertsBanner() {
  const { token } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    if (!token) return;
    void apiGet<{ alerts: Alert[] }>('/gestor/alerts', token)
      .then((r) => setAlerts(r.alerts ?? []))
      .catch(() => setAlerts([]));
  }, [token]);

  if (!alerts.length) return null;

  return (
    <div className="space-y-2">
      {alerts.map((a) => (
        <div
          key={a.code}
          className={
            a.level === 'critical'
              ? 'rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-200'
              : a.level === 'warning'
                ? 'rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-950 ring-1 ring-amber-200'
                : 'rounded-2xl bg-sky-50 px-4 py-3 text-sm text-sky-950 ring-1 ring-sky-200'
          }
        >
          {a.message}
        </div>
      ))}
    </div>
  );
}
