'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api-client';

export type DashboardSummary = {
  quickStats: {
    activeOpportunities: number;
    totalPipelineValue: number;
    wonCount: number;
    totalClosed: number;
    conversionRate: number;
    urgentAlerts: number;
  };
  pipelineByPhase: Array<{ phase: string; count: number; value: number }>;
  wonLost: { won: number; stop: number; cancelled: number };
  news: Array<{ id: string; action: string; opportunityTitle: string; timestamp: string }>;
};

export function useDashboardSummary() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/dashboard/summary');
      setData(res as DashboardSummary);
    } catch (e: any) {
      setError(e?.message ? String(e.message) : 'Failed to load dashboard summary');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, reload: load };
}
