'use client';

import { useMemo, useState } from 'react';
import { opportunities } from '@/lib/data';
import type { Opportunity } from '@/lib/types';
import { cn } from '@/lib/utils';
import { OpportunitiesListDialog } from './opportunities-list-dialog';

type Segment = {
  phase: Opportunity['opportunityphase'];
  amount: number;
  count: number;
};

const phaseOrder: Segment['phase'][] = ['Prospection', 'Discovery', 'Evaluation', 'Deal'];

const sumAmount = (o: Opportunity) => Number(o.value_forecast ?? 0);

export function PipelineSnake() {
  const [open, setOpen] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState<Opportunity['opportunityphase']>('Prospection');

  const segments = useMemo(() => {
    return phaseOrder.map((phase) => {
      const opps = opportunities.filter((o) => o.opportunityphase === phase);
      const amount = opps.reduce((acc, o) => acc + sumAmount(o), 0);
      return { phase, amount, count: opps.length };
    });
  }, []);

  const total = segments.reduce((a, s) => a + s.amount, 0) || 1;

  const selectedOpps = useMemo(
    () => opportunities.filter((o) => o.opportunityphase === selectedPhase),
    [selectedPhase]
  );

  return (
    <>
      <div className="space-y-3">
        <div className="text-sm text-muted-foreground">
          Click a segment to list opportunities in that phase.
        </div>

        <div className="flex w-full overflow-hidden rounded-2xl border bg-background">
          {segments.map((s, idx) => {
            const w = Math.max(8, Math.round((s.amount / total) * 100));
            return (
              <button
                key={s.phase}
                type="button"
                className={cn(
                  'group relative flex min-w-[64px] flex-col justify-center gap-0.5 px-3 py-4 text-left transition hover:brightness-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  idx === 0 && 'rounded-l-2xl',
                  idx === segments.length - 1 && 'rounded-r-2xl',
                  s.phase === 'Prospection' && 'bg-primary/10',
                  s.phase === 'Discovery' && 'bg-primary/15',
                  s.phase === 'Evaluation' && 'bg-primary/20',
                  s.phase === 'Deal' && 'bg-primary/25'
                )}
                style={{ width: `${w}%` }}
                onClick={() => {
                  setSelectedPhase(s.phase);
                  setOpen(true);
                }}
              >
                <div className="text-xs font-medium text-muted-foreground">{s.phase}</div>
                <div className="text-base font-semibold text-foreground">
                  {s.count} · {s.amount.toLocaleString()}
                </div>
                <div className="pointer-events-none absolute inset-y-0 right-0 w-px bg-border/60" />
              </button>
            );
          })}
        </div>
      </div>

      <OpportunitiesListDialog
        open={open}
        onOpenChange={setOpen}
        title={`Pipeline · ${selectedPhase}`}
        opportunities={selectedOpps}
      />
    </>
  );
}
