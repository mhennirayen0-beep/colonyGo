'use client';

import { useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

export type SalesPeriod = 'all' | '7d' | '30d' | '90d';

export type SalesFilters = {
  owner?: string;
  client?: string;
  query?: string;
  period?: SalesPeriod;
};

type Props = {
  owners: string[];
  clients: string[];
  value: SalesFilters;
  onChange: (next: SalesFilters) => void;
  className?: string;
};

export function SalesFiltersBar({ owners, clients, value, onChange, className }: Props) {
  const ownerItems = useMemo(() => ['All', ...owners], [owners]);
  const clientItems = useMemo(() => ['All', ...clients], [clients]);

  return (
    <div className={cn('grid gap-3 rounded-2xl border bg-card p-4 shadow-sm', className)}>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <div className="space-y-1.5">
          <Label>Search</Label>
          <Input
            placeholder="Opportunity, client, ID…"
            value={value.query ?? ''}
            onChange={(e) => onChange({ ...value, query: e.target.value })}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Period</Label>
          <Select
            value={value.period ?? 'all'}
            onValueChange={(v) => onChange({ ...value, period: v as SalesPeriod })}
          >
            <SelectTrigger>
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Sales owner</Label>
          <Select
            value={value.owner ?? 'All'}
            onValueChange={(v) => onChange({ ...value, owner: v === 'All' ? undefined : v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              {ownerItems.map((x) => (
                <SelectItem key={x} value={x}>
                  {x}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Client</Label>
          <Select
            value={value.client ?? 'All'}
            onValueChange={(v) => onChange({ ...value, client: v === 'All' ? undefined : v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              {clientItems.map((x) => (
                <SelectItem key={x} value={x}>
                  {x}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="text-xs text-muted-foreground">
        Filters apply to both <span className="font-medium text-foreground">Data</span> and{' '}
        <span className="font-medium text-foreground">View</span>.
      </div>
    </div>
  );
}
