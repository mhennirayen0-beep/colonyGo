'use client';

import { useMemo, useState } from 'react';
import { CartesianGrid, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from 'recharts';
import { ChartContainer, type ChartConfig } from '@/components/ui/chart';
import { opportunities } from '@/lib/data';
import type { Opportunity } from '@/lib/types';
import { OpportunitiesListDialog } from './opportunities-list-dialog';

const chartConfig = {
  bubble: { label: 'Client', color: 'hsl(var(--primary))' },
} satisfies ChartConfig;

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

export function ClientBubbleChart() {
  const [open, setOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<string>('');

  const points = useMemo(() => {
    const map = new Map<
      string,
      { client: string; x: number; y: number; z: number; oppIds: string[] }
    >();

    for (const o of opportunities) {
      const key = o.customername;
      const reactivity = clamp(50 + (o.swot_strength - o.swot_weakness) * 10, 0, 100);
      const payment = clamp(100 - (o.value_discount / Math.max(1, o.value_budget)) * 100, 0, 100);
      const size = Number(o.value_forecast ?? 0);

      const prev = map.get(key);
      if (!prev) {
        map.set(key, { client: key, x: reactivity, y: payment, z: size, oppIds: [o.opportunityid] });
      } else {
        // average x/y; sum z
        const count = prev.oppIds.length + 1;
        prev.x = (prev.x * (count - 1) + reactivity) / count;
        prev.y = (prev.y * (count - 1) + payment) / count;
        prev.z += size;
        prev.oppIds.push(o.opportunityid);
      }
    }

    return Array.from(map.values()).sort((a, b) => b.z - a.z);
  }, []);

  const selectedOpps = useMemo(() => {
    if (!selectedClient) return [];
    return opportunities.filter(o => o.customername === selectedClient);
  }, [selectedClient]);

  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        <ChartContainer config={chartConfig} className="h-[320px] md:col-span-2">
          <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              type="number"
              dataKey="x"
              name="Reactivity"
              domain={[0, 100]}
              tickFormatter={(v) => `${v}`}
            />
            <YAxis
              type="number"
              dataKey="y"
              name="Payment reliability"
              domain={[0, 100]}
              tickFormatter={(v) => `${v}`}
            />
            <ZAxis type="number" dataKey="z" range={[80, 520]} name="Volume" />
            <Tooltip
              cursor={{ strokeDasharray: '3 3' }}
              formatter={(v: any, name: any, props: any) => {
                if (name === 'Volume') return [Number(v).toLocaleString(), 'Volume'];
                return [v, name];
              }}
              labelFormatter={(_, payload) => payload?.[0]?.payload?.client ?? ''}
            />
            <Scatter
              data={points}
              fill="hsl(var(--primary))"
              onClick={(p: any) => {
                setSelectedClient(p?.client ?? '');
                setOpen(true);
              }}
            />
          </ScatterChart>
        </ChartContainer>

        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">Top clients (by volume)</div>
          <div className="space-y-2">
            {points.slice(0, 6).map((p) => (
              <button
                key={p.client}
                type="button"
                className="w-full rounded-xl border bg-background px-3 py-2 text-left hover:bg-muted/50"
                onClick={() => {
                  setSelectedClient(p.client);
                  setOpen(true);
                }}
              >
                <div className="font-medium">{p.client}</div>
                <div className="text-xs text-muted-foreground">
                  Reactivity {Math.round(p.x)} · Payment {Math.round(p.y)} · Volume {Math.round(p.z).toLocaleString()}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <OpportunitiesListDialog
        open={open}
        onOpenChange={setOpen}
        title={`Client · ${selectedClient}`}
        opportunities={selectedOpps}
      />
    </>
  );
}
