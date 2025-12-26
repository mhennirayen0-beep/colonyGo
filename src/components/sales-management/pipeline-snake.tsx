'use client';

import { cn } from '@/lib/utils';
import { formatCurrency } from './sales-utils';

type Segment = {
  phase: string;
  value: number;
  count: number;
};

type Props = {
  segments: Segment[];
  activePhase?: string;
  onPick?: (phase: string) => void;
  className?: string;
};

export function PipelineSnake({ segments, activePhase, onPick, className }: Props) {
  const total = segments.reduce((s, x) => s + (x.value || 0), 0) || 1;

  return (
    <div className={cn('w-full', className)}>
      <div className="mb-2 flex items-center justify-between text-sm">
        <div className="font-medium">Pipeline evolution</div>
        <div className="text-muted-foreground">Total: {formatCurrency(total)}</div>
      </div>

      <div className="flex overflow-hidden rounded-2xl border bg-background">
        {segments.map((seg, idx) => {
          const pct = Math.max(6, Math.round((seg.value / total) * 100));
          const isActive = activePhase ? seg.phase === activePhase : false;
          return (
            <button
              key={seg.phase}
              type="button"
              onClick={() => onPick?.(seg.phase)}
              className={cn(
                'relative flex min-h-14 flex-1 flex-col justify-center px-3 text-left transition',
                idx !== segments.length - 1 && 'border-r',
                'hover:bg-muted/50',
                isActive && 'bg-muted'
              )}
              style={{ flexBasis: `${pct}%` }}
            >
              <div className="text-xs text-muted-foreground">{seg.phase}</div>
              <div className="text-sm font-semibold">{formatCurrency(seg.value)}</div>
              <div className="text-xs text-muted-foreground">{seg.count} opp.</div>
            </button>
          );
        })}
      </div>

      <div className="mt-2 text-xs text-muted-foreground">
        Tap a segment to filter the dashboard by phase.
      </div>
    </div>
  );
}
