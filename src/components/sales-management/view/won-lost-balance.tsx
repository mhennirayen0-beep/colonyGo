'use client';

import { useMemo, useState } from 'react';
import { Pie, PieChart, Cell } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { opportunities } from '@/lib/data';
import type { Opportunity } from '@/lib/types';
import { OpportunitiesListDialog } from './opportunities-list-dialog';

const chartConfig = {
  won: { label: 'Won', color: 'hsl(var(--accent))' },
  lost: { label: 'Lost', color: 'hsl(var(--destructive))' },
  open: { label: 'In progress', color: 'hsl(var(--ring))' },
} satisfies ChartConfig;

const classify = (o: Opportunity) => {
  // Heuristic: "won" when final value > 0 AND status Start; "lost" when Cancelled/Stop with no final; else open.
  if (o.value_final > 0 && o.opportunitystatut === 'Start') return 'won';
  if ((o.opportunitystatut === 'Cancelled' || o.opportunitystatut === 'Stop') && o.value_final === 0) return 'lost';
  return 'open';
};

export function WonLostBalance() {
  const [open, setOpen] = useState(false);
  const [bucket, setBucket] = useState<'won' | 'lost' | 'open'>('open');

  const data = useMemo(() => {
    const buckets: Record<'won' | 'lost' | 'open', { name: string; value: number; amount: number }> = {
      won: { name: 'Won', value: 0, amount: 0 },
      lost: { name: 'Lost', value: 0, amount: 0 },
      open: { name: 'In progress', value: 0, amount: 0 },
    };

    for (const o of opportunities) {
      const k = classify(o);
      buckets[k].value += 1;
      buckets[k].amount += Number(o.value_forecast ?? 0);
    }

    return (Object.keys(buckets) as Array<keyof typeof buckets>).map((k) => ({
      key: k,
      name: buckets[k].name,
      value: buckets[k].value,
      amount: Math.round(buckets[k].amount),
      fill: `var(--color-${k})`,
    }));
  }, []);

  const selectedOpps = useMemo(() => opportunities.filter(o => classify(o) === bucket), [bucket]);

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <ChartContainer config={chartConfig} className="h-[260px]">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={55}
              outerRadius={95}
              paddingAngle={3}
              onClick={(entry: any) => {
                setBucket(entry.payload.key);
                setOpen(true);
              }}
            >
              {data.map((d) => (
                <Cell key={d.key} fill={d.fill} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>

        <div className="space-y-3">
          {data.map((d) => (
            <button
              key={d.key}
              type="button"
              className="flex w-full items-center justify-between rounded-xl border bg-background px-4 py-3 text-left hover:bg-muted/50"
              onClick={() => {
                setBucket(d.key);
                setOpen(true);
              }}
            >
              <div>
                <div className="text-sm text-muted-foreground">{d.name}</div>
                <div className="text-lg font-semibold">{d.value} opportunities</div>
              </div>
              <div className="text-sm font-medium text-muted-foreground">{d.amount.toLocaleString()}</div>
            </button>
          ))}
          <div className="text-xs text-muted-foreground">
            Tip: click the chart or a line to open the list.
          </div>
        </div>
      </div>

      <OpportunitiesListDialog
        open={open}
        onOpenChange={setOpen}
        title={`Won/Lost · ${bucket}`}
        opportunities={selectedOpps}
      />
    </>
  );
}
