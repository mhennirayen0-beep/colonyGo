'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Building2, ChevronRight, Phone, Mail, Users2, TrendingUp, AlertTriangle } from 'lucide-react';

import type { Opportunity, SalesAlertRow } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

type AccountRow = {
  customerid: string;
  customername: string;
  owners: string[];
  opportunities: Opportunity[];
  pipelineForecast: number;
  wonCount: number;
  lostCount: number;
  riskScore: number; // 0..100 (prototype)
};

function money(n: number) {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
  } catch {
    return `${Math.round(n)} €`;
  }
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function SalesCrmView({
  opportunities,
  alerts,
  className,
}: {
  opportunities: Opportunity[];
  alerts: SalesAlertRow[];
  className?: string;
}) {
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<AccountRow | null>(null);
  const [open, setOpen] = useState(false);

  const accounts = useMemo<AccountRow[]>(() => {
    const byCustomer = new Map<string, Opportunity[]>();
    for (const opp of opportunities) {
      const key = opp.customerid || opp.customername;
      const arr = byCustomer.get(key) ?? [];
      arr.push(opp);
      byCustomer.set(key, arr);
    }

    const rows: AccountRow[] = [];
    for (const [key, opps] of byCustomer.entries()) {
      const customerid = opps[0]?.customerid ?? key;
      const customername = opps[0]?.customername ?? key;
      const owners = Array.from(new Set(opps.map((o) => o.opportunityowner))).sort((a, b) => a.localeCompare(b));
      const pipelineForecast = opps.reduce((s, o) => s + (o.value_forecast ?? 0), 0);
      const wonCount = opps.filter((o) => o.opportunitystatut === 'Stop').length;
      const lostCount = opps.filter((o) => o.opportunitystatut === 'Cancelled').length;

      // Prototype risk score: based on alerts delay + lost ratio.
      const alertPenalty = opps.reduce((acc, o) => {
        const a = alerts.find((x) => x.opportunityname === o.opportunityname);
        if (!a) return acc;
        return acc + clamp(a.delay_days, 0, 60);
      }, 0);
      const lossPenalty = opps.length ? (lostCount / opps.length) * 100 : 0;
      const riskScore = clamp(Math.round(alertPenalty * 0.8 + lossPenalty * 0.8), 0, 100);

      rows.push({
        customerid,
        customername,
        owners,
        opportunities: opps,
        pipelineForecast,
        wonCount,
        lostCount,
        riskScore,
      });
    }

    rows.sort((a, b) => b.pipelineForecast - a.pipelineForecast);
    return rows;
  }, [opportunities, alerts]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return accounts;
    return accounts.filter((a) => {
      const hay = `${a.customerid} ${a.customername} ${a.owners.join(' ')}`.toLowerCase();
      return hay.includes(qq);
    });
  }, [accounts, q]);

  const totals = useMemo(() => {
    const clients = accounts.length;
    const oppCount = accounts.reduce((s, a) => s + a.opportunities.length, 0);
    const pipeline = accounts.reduce((s, a) => s + a.pipelineForecast, 0);
    const riskSignals = accounts.filter((a) => a.riskScore >= 60).length;
    return { clients, oppCount, pipeline, riskSignals };
  }, [accounts]);

  const openAccount = (a: AccountRow) => {
    setSelected(a);
    setOpen(true);
  };

  const riskBadge = (risk: number) => {
    if (risk >= 75) return <Badge variant="destructive">High risk</Badge>;
    if (risk >= 50) return <Badge variant="secondary" className="border-transparent bg-yellow-100 text-yellow-900">Medium risk</Badge>;
    return <Badge variant="secondary" className="border-transparent bg-emerald-100 text-emerald-900">Healthy</Badge>;
  };

  return (
    <div className={cn('space-y-6', className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-headline text-2xl font-bold text-primary">CRM</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Accounts overview built from Sales opportunities (prototype).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" className="hidden sm:inline-flex">
            <Users2 className="mr-2 h-4 w-4" />
            Add contact
          </Button>
          <Button variant="accent">
            <Building2 className="mr-2 h-4 w-4" />
            New account
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Clients</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{totals.clients}</CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Opportunities</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{totals.oppCount}</CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Pipeline forecast</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{money(totals.pipeline)}</CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Risk signals</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-2xl font-semibold">
            <AlertTriangle className="h-5 w-5 text-muted-foreground" />
            {totals.riskSignals}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle className="text-lg">Accounts</CardTitle>
            <p className="text-sm text-muted-foreground">Search, open account, see related opportunities.</p>
          </div>
          <div className="w-full max-w-sm">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search client, owner, id…" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Owners</TableHead>
                  <TableHead className="text-right">Opps</TableHead>
                  <TableHead className="text-right">Pipeline</TableHead>
                  <TableHead className="text-right">Win/Loss</TableHead>
                  <TableHead className="text-right">Risk</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((a) => (
                  <TableRow key={a.customerid} className="cursor-pointer" onClick={() => openAccount(a)}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-secondary">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="font-semibold">{a.customername}</div>
                          <div className="text-xs text-muted-foreground">{a.customerid}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{a.owners.join(', ')}</TableCell>
                    <TableCell className="text-right font-medium">{a.opportunities.length}</TableCell>
                    <TableCell className="text-right font-medium">{money(a.pipelineForecast)}</TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {a.wonCount} / {a.lostCount}
                    </TableCell>
                    <TableCell className="text-right">{riskBadge(a.riskScore)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openAccount(a)}>
                        Open <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <div className="grid gap-3 md:hidden">
            {filtered.map((a) => (
              <button
                key={a.customerid}
                className="rounded-2xl border bg-background p-4 text-left shadow-sm"
                onClick={() => openAccount(a)}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold">{a.customername}</div>
                    <div className="text-xs text-muted-foreground">{a.customerid} · {a.opportunities.length} opps</div>
                  </div>
                  {riskBadge(a.riskScore)}
                </div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Pipeline</span>
                  <span className="font-semibold">{money(a.pipelineForecast)}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Owners</span>
                  <span className="truncate font-medium">{a.owners.join(', ')}</span>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>{selected?.customername ?? 'Account'}</SheetTitle>
          </SheetHeader>

          {selected ? (
            <div className="mt-4 space-y-6">
              <Card className="rounded-2xl">
                <CardContent className="pt-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-sm text-muted-foreground">Account</div>
                      <div className="text-xl font-semibold">{selected.customername}</div>
                      <div className="text-sm text-muted-foreground">{selected.customerid}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {riskBadge(selected.riskScore)}
                      <Badge variant="secondary" className="gap-1">
                        <TrendingUp className="h-3.5 w-3.5" />
                        {money(selected.pipelineForecast)}
                      </Badge>
                    </div>
                  </div>

                  {/* Placeholder contact actions (prototype) */}
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    <Button variant="secondary" className="justify-start">
                      <Mail className="mr-2 h-4 w-4" /> Email contact
                    </Button>
                    <Button variant="secondary" className="justify-start">
                      <Phone className="mr-2 h-4 w-4" /> Call
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-base">Related opportunities</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {selected.opportunities
                    .slice()
                    .sort((a, b) => (b.value_forecast ?? 0) - (a.value_forecast ?? 0))
                    .slice(0, 12)
                    .map((o) => (
                      <div key={o.id} className="flex items-center justify-between gap-3 rounded-xl border p-3">
                        <div className="min-w-0">
                          <div className="truncate font-semibold">{o.opportunityname}</div>
                          <div className="text-xs text-muted-foreground">
                            {o.opportunityphase} · {o.opportunitystatut} · {o.opportunityowner}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{money(o.value_forecast ?? 0)}</Badge>
                          <Button asChild variant="ghost" size="sm">
                            <Link href={`/opportunities/${o.id}`}>View</Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                </CardContent>
              </Card>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
