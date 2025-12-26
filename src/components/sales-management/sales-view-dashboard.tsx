'use client';

import { useMemo, useRef, useState } from 'react';
import type { Opportunity, SalesAlertRow } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ExportActions } from './sales-export-actions';
import { PipelineSnake } from './pipeline-snake';
import { ClientBubbleChart } from './client-bubble-chart';
import { VolumeByCategoryChart } from './volume-by-category-chart';
import { WorkloadChart } from './workload-chart';
import { WonLostBalanceChart } from './won-lost-balance-chart';
import { SalesCommitteeKanban } from './sales-kanban';
import { formatCurrency } from './sales-utils';

type Props = {
  opportunities: Opportunity[];
  alerts: SalesAlertRow[];
};

export function SalesViewDashboard({ opportunities, alerts }: Props) {
  const [phaseFilter, setPhaseFilter] = useState<string | undefined>();
  const [wonLostPick, setWonLostPick] = useState<'Won' | 'Lost' | undefined>();
  const dashRef = useRef<HTMLDivElement>(null);

  const filteredOpps = useMemo(() => {
    if (!phaseFilter) return opportunities;
    return opportunities.filter((o) => o.opportunityphase === phaseFilter);
  }, [opportunities, phaseFilter]);

  const segments = useMemo(() => {
    const phases = ['Prospection', 'Discovery', 'Evaluation', 'Deal'] as const;
    return phases.map((p) => {
      const ops = opportunities.filter((o) => o.opportunityphase === p);
      const value = ops.reduce((s, o) => s + (o.value_forecast || 0), 0);
      return { phase: p, value, count: ops.length };
    });
  }, [opportunities]);

  const won = filteredOpps.filter((o) => o.opportunitystatut === 'Start').length;
  const lost = filteredOpps.filter((o) => o.opportunitystatut === 'Stop' || o.opportunitystatut === 'Cancelled').length;
  const forecastTotal = filteredOpps.reduce((s, o) => s + (o.value_forecast || 0), 0);

  const bubbleData = useMemo(() => {
    const byClient: Record<string, Opportunity[]> = {};
    filteredOpps.forEach((o) => {
      byClient[o.customername] = byClient[o.customername] || [];
      byClient[o.customername].push(o);
    });

    return Object.entries(byClient).map(([client, ops]) => {
      const volume = ops.reduce((s, o) => s + (o.value_forecast || 0), 0);
      const reactivity = Math.min(100, Math.round((ops.reduce((s, o) => s + (o.swot_strength + o.swot_opportunities) / 2, 0) / ops.length) * 20));
      const avgDiscount = ops.reduce((s, o) => s + (o.value_discount || 0), 0) / ops.length;
      const reliability = Math.max(0, Math.min(100, Math.round(100 - avgDiscount / 1000)));
      return { client, reactivity, reliability, volume };
    });
  }, [filteredOpps]);

  const volumeByCategory = useMemo(() => {
    return [
      {
        name: 'Pipeline',
        Hardware: filteredOpps.reduce((s, o) => s + (o.hardware_price || 0), 0),
        Software: filteredOpps.reduce((s, o) => s + (o.software_price || 0), 0),
        Services: filteredOpps.reduce((s, o) => s + (o.service_price || 0), 0),
      },
    ];
  }, [filteredOpps]);

  const workload = useMemo(() => {
    const owners = Array.from(new Set(filteredOpps.map((o) => o.opportunityowner)));
    return owners.map((owner) => {
      const ops = filteredOpps.filter((o) => o.opportunityowner === owner);
      const opps = ops.length;
      const value = ops.reduce((s, o) => s + (o.value_forecast || 0), 0);
      const w = ops.filter((o) => o.opportunitystatut === 'Start').length;
      const l = ops.filter((o) => o.opportunitystatut === 'Stop' || o.opportunitystatut === 'Cancelled').length;
      const winRate = w + l > 0 ? Math.round((w / (w + l)) * 100) : 0;
      return { owner, opps, value, winRate };
    });
  }, [filteredOpps]);

  const topAlerts = useMemo(() => {
    return alerts.slice().sort((a, b) => (b.delay_days || 0) - (a.delay_days || 0)).slice(0, 5);
  }, [alerts]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-headline text-2xl font-bold text-primary">Sales Management Dashboard</h2>
          <p className="text-sm text-muted-foreground">
            Visual analytics & committee view. Forecast total: <span className="font-semibold text-foreground">{formatCurrency(forecastTotal)}</span>
          </p>
        </div>

        <ExportActions filenameBase="sales_view_dashboard" element={dashRef.current} />
      </div>

      <div ref={dashRef} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Pipeline</CardTitle>
            <CardDescription>Click a segment to filter the dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <PipelineSnake segments={segments} activePhase={phaseFilter} onPick={(p) => setPhaseFilter(p === phaseFilter ? undefined : p)} />
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="font-headline">Won vs Lost</CardTitle>
              <CardDescription>Counts from filtered pipeline</CardDescription>
            </CardHeader>
            <CardContent>
              <WonLostBalanceChart
                won={won}
                lost={lost}
                active={wonLostPick}
                onPick={(v) => setWonLostPick((prev) => (prev === v ? undefined : v))}
              />

              <div className="mt-3 grid grid-cols-2 gap-3 text-center">
                <button
                  type="button"
                  onClick={() => setWonLostPick((p) => (p === 'Won' ? undefined : 'Won'))}
                  className="rounded-2xl border bg-muted/30 p-4"
                >
                  <div className="text-xs text-muted-foreground">Won</div>
                  <div className="mt-1 text-2xl font-bold text-primary">{won}</div>
                </button>
                <button
                  type="button"
                  onClick={() => setWonLostPick((p) => (p === 'Lost' ? undefined : 'Lost'))}
                  className="rounded-2xl border bg-muted/30 p-4"
                >
                  <div className="text-xs text-muted-foreground">Lost</div>
                  <div className="mt-1 text-2xl font-bold text-destructive">{lost}</div>
                </button>
              </div>

              {wonLostPick && (
                <div className="mt-4 rounded-2xl border bg-background p-4">
                  <div className="text-xs text-muted-foreground">{wonLostPick} opportunities (top 6)</div>
                  <div className="mt-2 space-y-2">
                    {filteredOpps
                      .filter((o) =>
                        wonLostPick === 'Won'
                          ? o.opportunitystatut === 'Start'
                          : o.opportunitystatut === 'Stop' || o.opportunitystatut === 'Cancelled'
                      )
                      .slice(0, 6)
                      .map((o) => (
                        <div key={o.id} className="flex items-center justify-between gap-2 text-sm">
                          <div className="truncate">{o.opportunityname}</div>
                          <div className="shrink-0 font-mono text-xs text-muted-foreground">{o.id}</div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              <div className="mt-4 rounded-2xl border bg-background p-4">
                <div className="text-xs text-muted-foreground">Top alerts (delay)</div>
                <div className="mt-2 space-y-2">
                  {topAlerts.map((a, idx) => (
                    <div key={`${a.opportunityname}-${idx}`} className="flex items-center justify-between gap-2 text-sm">
                      <div className="truncate">{a.opportunityname}</div>
                      <div className="shrink-0 font-mono text-xs text-muted-foreground">{a.delay_days}d</div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="lg:col-span-2">
            <ClientBubbleChart data={bubbleData.map((x) => ({ ...x, client: x.client })) as any} />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <VolumeByCategoryChart data={volumeByCategory as any} />
          <WorkloadChart data={workload as any} />
        </div>

        <SalesCommitteeKanban items={filteredOpps} />
      </div>
    </div>
  );
}
