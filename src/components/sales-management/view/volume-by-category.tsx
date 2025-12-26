'use client';

import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { opportunities } from '@/lib/data';
import type { Opportunity } from '@/lib/types';
import { OpportunitiesListDialog } from './opportunities-list-dialog';

const chartConfig = {
  hardware: { label: 'Hardware', color: 'hsl(var(--primary))' },
  software: { label: 'Software', color: 'hsl(var(--ring))' },
  service: { label: 'Service', color: 'hsl(var(--accent))' },
} satisfies ChartConfig;

const phaseOrder: Opportunity['opportunityphase'][] = ['Prospection', 'Discovery', 'Evaluation', 'Deal'];

export function VolumeByCategory() {
  const [open, setOpen] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState<Opportunity['opportunityphase']>('Prospection');

  const data = useMemo(() => {
    return phaseOrder.map((phase) => {
      const opps = opportunities.filter(o => o.opportunityphase === phase);
      return {
        phase,
        hardware: opps.reduce((a, o) => a + Number(o.hardware_price ?? 0), 0),
        software: opps.reduce((a, o) => a + Number(o.software_price ?? 0), 0),
        service: opps.reduce((a, o) => a + Number(o.service_price ?? 0), 0),
      };
    });
  }, []);

  const selectedOpps = useMemo(() => opportunities.filter(o => o.opportunityphase === selectedPhase), [selectedPhase]);

  return (
    <>
      <ChartContainer config={chartConfig} className="h-[320px]">
        <BarChart
          data={data}
          onClick={(e: any) => {
            const p = e?.activeLabel as Opportunity['opportunityphase'];
            if (!p) return;
            setSelectedPhase(p);
            setOpen(true);
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="phase" />
          <YAxis tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Legend />
          <Bar dataKey="hardware" stackId="a" fill="var(--color-hardware)" radius={[8, 8, 0, 0]} />
          <Bar dataKey="software" stackId="a" fill="var(--color-software)" radius={[0, 0, 0, 0]} />
          <Bar dataKey="service" stackId="a" fill="var(--color-service)" radius={[0, 0, 8, 8]} />
        </BarChart>
      </ChartContainer>

      <OpportunitiesListDialog
        open={open}
        onOpenChange={setOpen}
        title={`Volume by category · ${selectedPhase}`}
        opportunities={selectedOpps}
      />
    </>
  );
}
