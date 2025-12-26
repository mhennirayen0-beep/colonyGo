'use client';

import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { actionsToFollow, opportunities } from '@/lib/data';
import type { Opportunity } from '@/lib/types';
import { OpportunitiesListDialog } from './opportunities-list-dialog';

const chartConfig = {
  pipeline: { label: 'Pipeline value', color: 'hsl(var(--primary))' },
  count: { label: 'Opportunities', color: 'hsl(var(--ring))' },
} satisfies ChartConfig;

export function WorkloadPerformance() {
  const [open, setOpen] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState<string>('');

  const data = useMemo(() => {
    const owners = Array.from(new Set(opportunities.map(o => o.opportunityowner)));
    return owners.map((owner) => {
      const opps = opportunities.filter(o => o.opportunityowner === owner);
      const pipeline = opps.reduce((a, o) => a + Number(o.value_forecast ?? 0), 0);
      const actionCount = actionsToFollow.filter(a => a.salesowner === owner).length;
      return { owner, pipeline, count: opps.length, actions: actionCount };
    }).sort((a,b) => b.pipeline - a.pipeline);
  }, []);

  const selectedOpps = useMemo<Opportunity[]>(() => {
    if (!selectedOwner) return [];
    return opportunities.filter(o => o.opportunityowner === selectedOwner);
  }, [selectedOwner]);

  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        <ChartContainer config={chartConfig} className="h-[320px] md:col-span-2">
          <BarChart
            data={data}
            margin={{ left: 0, right: 10 }}
            onClick={(e: any) => {
              const idx = e?.activeTooltipIndex;
              if (typeof idx !== 'number') return;
              const owner = data[idx]?.owner;
              if (!owner) return;
              setSelectedOwner(owner);
              setOpen(true);
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="owner" tick={{ fontSize: 12 }} interval={0} angle={-18} height={55} />
            <YAxis tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="pipeline" fill="var(--color-pipeline)" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ChartContainer>

        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">Workload snapshot</div>
          <div className="space-y-2">
            {data.slice(0, 6).map((d) => (
              <button
                key={d.owner}
                type="button"
                className="w-full rounded-xl border bg-background px-3 py-2 text-left hover:bg-muted/50"
                onClick={() => {
                  setSelectedOwner(d.owner);
                  setOpen(true);
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium">{d.owner}</div>
                  <div className="text-xs text-muted-foreground">{d.pipeline.toLocaleString()}</div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {d.count} opportunities · {d.actions} actions
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <OpportunitiesListDialog
        open={open}
        onOpenChange={setOpen}
        title={`Owner · ${selectedOwner}`}
        opportunities={selectedOpps}
      />
    </>
  );
}
