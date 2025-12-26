'use client';

import type { Opportunity } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { statusClass, phaseVariant, formatCurrency } from './sales-utils';
import { cn } from '@/lib/utils';

type Props = {
  items: Opportunity[];
};

const columns = ['À faire', 'En cours', 'Validé', 'Clos'] as const;

function columnFor(opp: Opportunity): (typeof columns)[number] {
  if (opp.opportunitystatut === 'Stop' || opp.opportunitystatut === 'Cancelled') return 'Clos';
  if (opp.opportunityphase === 'Evaluation') return 'En cours';
  if (opp.opportunityphase === 'Deal') return 'Validé';
  return 'À faire';
}

export function SalesCommitteeKanban({ items }: Props) {
  const grouped: Record<string, Opportunity[]> = {};
  columns.forEach((c) => (grouped[c] = []));
  items.forEach((o) => grouped[columnFor(o)].push(o));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Sales committee Kanban</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 lg:grid-cols-4">
          {columns.map((col) => (
            <div key={col} className="rounded-2xl border bg-muted/30 p-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm font-semibold">{col}</div>
                <div className="text-xs text-muted-foreground">{grouped[col].length}</div>
              </div>
              <div className="space-y-2">
                {grouped[col].slice(0, 8).map((o) => (
                  <div key={o.id} className={cn('rounded-2xl border bg-background p-3 shadow-sm')}>
                    <div className="text-sm font-semibold">{o.opportunityname}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{o.customername}</div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge variant={phaseVariant[o.opportunityphase]}>{o.opportunityphase}</Badge>
                      <Badge className={statusClass[o.opportunitystatut]}>{o.opportunitystatut}</Badge>
                      <span className="text-xs font-medium text-primary">{formatCurrency(o.value_forecast)}</span>
                    </div>
                  </div>
                ))}
                {grouped[col].length > 8 && (
                  <div className="text-xs text-muted-foreground">+{grouped[col].length - 8} more…</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
