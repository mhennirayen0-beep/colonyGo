'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { opportunities } from '@/lib/data';
import type { Opportunity } from '@/lib/types';
import { cn } from '@/lib/utils';

type ColumnKey = 'todo' | 'in_progress' | 'validated' | 'closed';

const columns: { key: ColumnKey; title: string; hint: string }[] = [
  { key: 'todo', title: 'À faire', hint: 'Early stages' },
  { key: 'in_progress', title: 'En cours', hint: 'Evaluation / active work' },
  { key: 'validated', title: 'Validé', hint: 'Ready for committee / Deal' },
  { key: 'closed', title: 'Clos', hint: 'Stop / Cancelled' },
];

const bucketOf = (o: Opportunity): ColumnKey => {
  if (o.opportunitystatut === 'Stop' || o.opportunitystatut === 'Cancelled') return 'closed';
  if (o.opportunityphase === 'Deal') return 'validated';
  if (o.opportunityphase === 'Evaluation') return 'in_progress';
  return 'todo';
};

export function SalesCommitteeKanban() {
  const grouped = useMemo(() => {
    const m: Record<ColumnKey, Opportunity[]> = { todo: [], in_progress: [], validated: [], closed: [] };
    for (const o of opportunities) m[bucketOf(o)].push(o);
    for (const k of Object.keys(m) as ColumnKey[]) {
      m[k] = m[k].sort((a, b) => Number(b.value_forecast ?? 0) - Number(a.value_forecast ?? 0)).slice(0, 10);
    }
    return m;
  }, []);

  return (
    <div className="grid gap-4 lg:grid-cols-4">
      {columns.map((c) => (
        <div key={c.key} className="rounded-2xl border bg-background">
          <div className="border-b px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="font-semibold">{c.title}</div>
              <div className="text-xs text-muted-foreground">{grouped[c.key].length}</div>
            </div>
            <div className="text-xs text-muted-foreground">{c.hint}</div>
          </div>

          <div className="space-y-2 p-3">
            {grouped[c.key].map((o) => (
              <Link
                key={o.opportunityid}
                href={`/opportunities/${o.opportunityid}`}
                className={cn(
                  'block rounded-xl border bg-background p-3 hover:bg-muted/50',
                  c.key === 'closed' && 'opacity-80'
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{o.opportunityname}</div>
                    <div className="truncate text-xs text-muted-foreground">{o.customername}</div>
                  </div>
                  <div className="text-xs font-medium text-muted-foreground">
                    {Number(o.value_forecast ?? 0).toLocaleString()}
                  </div>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  {o.opportunityowner} · {o.opportunityphase} · {o.opportunitystatut}
                </div>
              </Link>
            ))}
            {grouped[c.key].length === 0 ? <div className="text-sm text-muted-foreground">No items</div> : null}
          </div>
        </div>
      ))}
    </div>
  );
}
