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
  currency?: string;
  mixedCurrencies?: boolean;
};

export function PipelineSnake({ segments, activePhase, onPick, className, currency = 'EUR', mixedCurrencies }: Props) {
  const total = segments.reduce((s, x) => s + (Number(x.value) || 0), 0) || 1;

  // Compute widths as integer percentages that always sum to 100.
  // (Matches the spec: each phase gets a proportional part of the snake width.)
  const pct = (() => {
    const raw = segments.map((s) => ((Number(s.value) || 0) / total) * 100);
    const base = raw.map((x) => Math.floor(x));
    const rem = raw.map((x, i) => ({ i, r: x - base[i] }));
    const baseSum = base.reduce((a, b) => a + b, 0);
    let left = Math.max(0, 100 - baseSum);
    rem.sort((a, b) => b.r - a.r);
    const out = base.slice();
    for (let k = 0; k < out.length && left > 0; k++) {
      out[rem[k].i] += 1;
      left -= 1;
    }
    return out;
  })();

  return (
    <div className={cn('w-full', className)}>
      <div className="mb-2 flex items-center justify-between text-sm">
        <div className="font-medium">Pipeline evolution</div>
        <div className="text-muted-foreground">
          Total: {formatCurrency(total, currency)}
          {mixedCurrencies ? <span className="ml-2">(mixed currencies)</span> : null}
        </div>
      </div>

      <div className="flex overflow-hidden rounded-2xl border bg-background">
        {segments.map((seg, idx) => {
          const isActive = activePhase ? seg.phase === activePhase : false;
          return (
            <button
              key={seg.phase}
              type="button"
              onClick={() => onPick?.(seg.phase)}
              className={cn(
                'relative flex min-h-14 flex-col justify-center px-3 text-left transition',
                idx !== segments.length - 1 && 'border-r',
                'hover:bg-muted/50',
                isActive && 'bg-muted'
              )}
              style={{ flex: `0 0 ${pct[idx]}%`, minWidth: 96 }}
            >
              <div className="text-xs text-muted-foreground">{seg.phase}</div>
              <div className="text-sm font-semibold">{formatCurrency(seg.value, currency)}</div>
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
